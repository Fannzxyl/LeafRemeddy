// C:\LeafRemedy\jamuku-backend\controllers\InventoryController.js
import db from "../db.js"; // db sekarang adalah instance pool yang berbasis Promise

// Fungsi untuk mendapatkan semua inventaris/produk
export const getInventory = async (req, res) => {
    try {
        const { userRole } = req.user; // Mengakses userRole dari token
        let query;

        // Query berbeda berdasarkan role
        if (userRole === "MANAGER") {
            query = `SELECT inv.id, inv.namaProduk AS name, inv.kategori, inv.stok, inv.satuan, inv.status, inv.id_lokasi, loc.nama AS lokasi
                     FROM inventories inv
                     LEFT JOIN locations loc ON inv.id_lokasi = loc.id
                     ORDER BY inv.id DESC`;
        } else { // Asumsi STAZ atau role lain yang hanya melihat ACTIVE
            query = `SELECT inv.id, inv.namaProduk AS name, inv.kategori, inv.stok, inv.satuan, inv.status, inv.id_lokasi, loc.nama AS lokasi
                     FROM inventories inv
                     LEFT JOIN locations loc ON inv.id_lokasi = loc.id
                     WHERE inv.status = 'ACTIVE'
                     ORDER BY inv.id DESC`;
        }

        console.log("Executing getInventory query:", query);

        // Menggunakan await db.query() untuk Promise-based query
        const [results] = await db.query(query); // db.query() sekarang mengembalikan [rows, fields]

        console.log("getInventory: Successfully fetched", results.length, "inventory items.");
        res.json(results); // Mengembalikan array objek
    } catch (err) {
        console.error("Error fetching inventory:", err);
        res.status(500).json({ message: "Gagal mengambil inventaris", error: err.message });
    }
};

// Fungsi untuk mendapatkan inventaris/produk berdasarkan ID
export const getInventoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const { userRole } = req.user;

        let query = `
            SELECT inv.id, inv.namaProduk AS name, inv.kategori, inv.stok, inv.satuan, inv.status, inv.id_lokasi, loc.nama AS lokasi
            FROM inventories inv
            LEFT JOIN locations loc ON inv.id_lokasi = loc.id
            WHERE inv.id = ?`;

        if (userRole === "STAZ") {
            query += ` AND inv.status = 'ACTIVE'`;
        }

        // Menggunakan await db.query() dengan parameter
        const [results] = await db.query(query, [id]);

        if (results.length === 0) {
            return res.status(404).json({ message: "Item inventaris tidak ditemukan" });
        }
        res.json(results[0]); // Mengembalikan objek tunggal
    } catch (err) {
        console.error("Error fetching inventory by ID:", err);
        res.status(500).json({ message: "Gagal mengambil item inventaris", error: err.message });
    }
};

// Fungsi untuk membuat item inventaris baru
export const createInventory = async (req, res) => {
    const { namaProduk, kategori, stok, satuan, status, id_lokasi } = req.body;
    const userId = req.userIdFromToken;
    const userRole = req.userRoleFromToken;

    if (!namaProduk || !kategori || !satuan || !id_lokasi) {
        return res.status(400).json({ message: "Semua field wajib diisi" });
    }
    if (isNaN(stok) || parseInt(stok) < 0) {
        return res.status(400).json({ message: "Stok harus berupa angka positif" });
    }

    try {
        if (userRole === "MANAGER") {
            const insertQuery = `
                INSERT INTO inventories (namaProduk, kategori, stok, satuan, status, id_lokasi)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            // Menggunakan await db.query() untuk Promise-based query
            const [result] = await db.query(
                insertQuery,
                [namaProduk, kategori, parseInt(stok), satuan, status || "ACTIVE", parseInt(id_lokasi)]
            );
            res.status(201).json({ message: "Item inventaris berhasil ditambahkan", id: result.insertId, type: "direct" });

        } else if (userRole === "STAZ") {
            const connection = await db.getConnection(); // Dapatkan koneksi Promise-based
            try {
                await connection.beginTransaction();

                const insertProductQuery = `
                    INSERT INTO inventories (namaProduk, kategori, stok, satuan, status, id_lokasi)
                    VALUES (?, ?, 0, ?, 'INACTIVE', ?)
                `;
                // Menggunakan await connection.execute() untuk Promise-based query dalam transaksi
                const [productResult] = await connection.execute(
                    insertProductQuery,
                    [namaProduk, kategori, satuan, parseInt(id_lokasi)]
                );

                const newProductId = productResult.insertId;

                const insertTransactionQuery = `
                    INSERT INTO transactions (
                        id_inventories, jumlah, tipe, status, tanggal, created_by, transaction_type,
                        namaProduk, kategori, satuan, id_lokasi, requested_stok
                    )
                    VALUES (?, ?, 'masuk', 'pending', CURDATE(), ?, 'add_product', ?, ?, ?, ?, ?)
                `;
                // Menggunakan await connection.execute()
                await connection.execute(
                    insertTransactionQuery,
                    [
                        newProductId,
                        parseInt(stok),
                        userId,
                        namaProduk,
                        kategori,
                        satuan,
                        parseInt(id_lokasi),
                        parseInt(stok)
                    ]
                );

                await connection.commit();
                res.status(201).json({
                    message: "Permintaan penambahan produk telah dikirim untuk approval",
                    id: newProductId,
                    type: "approval_needed",
                });
            } catch (err) {
                await connection.rollback();
                console.error("createInventory (STAZ): Error during transaction:", err);
                res.status(500).json({ message: "Gagal membuat permintaan approval", error: err.message, sql: err.sql });
            } finally {
                connection.release(); // Pastikan koneksi dilepaskan
            }
        } else {
            res.status(403).json({ message: "Akses ditolak. Peran tidak diizinkan untuk membuat inventaris." });
        }
    } catch (err) {
        console.error("Error creating inventory item:", err);
        res.status(500).json({ message: "Gagal menambahkan item inventaris", error: err.message });
    }
};

// Fungsi untuk memperbarui item inventaris
export const updateInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const { namaProduk, kategori, stok, satuan, status, id_lokasi } = req.body;
        const userRole = req.user.userRole; // Pastikan ini mengambil userRole dari token decoded

        if (userRole !== "MANAGER") {
            if (userRole === "STAZ") {
                return res.status(403).json({ message: "Akses ditolak. STAZ tidak dapat mengubah status atau stok langsung." });
            } else {
                return res.status(403).json({ message: "Akses ditolak. Hanya Manager atau STAZ yang dapat mengupdate inventaris." });
            }
        }

        if (!namaProduk || !kategori || !satuan || !id_lokasi) {
            return res.status(400).json({ message: "Semua field wajib diisi" });
        }
        if (isNaN(stok) || parseInt(stok) < 0) {
            return res.status(400).json({ message: "Stok harus berupa angka positif!" });
        }

        const sql = `
            UPDATE inventories
            SET namaProduk = ?, kategori = ?, stok = ?, satuan = ?, status = ?, id_lokasi = ?
            WHERE id = ?
        `;
        // Menggunakan await db.query()
        const [result] = await db.query(
            sql,
            [namaProduk, kategori, parseInt(stok), satuan, status, parseInt(id_lokasi), id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Item inventaris tidak ditemukan atau tidak ada perubahan" });
        }
        res.json({ message: "Item inventaris berhasil diupdate" });
    } catch (err) {
        console.error("Error updating inventory:", err);
        res.status(500).json({ message: "Gagal mengupdate inventaris", error: err.message, sqlState: err.sqlState, sqlMessage: err.sqlMessage, sql: err.sql });
    }
};

// Fungsi untuk menghapus item inventaris
export const deleteInventory = async (req, res) => {
    const { id } = req.params; // ID dari URL params (tipe string)
    const productId = parseInt(id); // Mengonversi ID ke integer secara eksplisit
    const userRole = req.user.userRole;

    if (userRole !== "MANAGER") {
        console.log("DeleteInventory: Access denied. Role not MANAGER or userRole is missing:", userRole);
        return res.status(403).json({ message: "Akses ditolak. Hanya Manager yang dapat menghapus inventaris." });
    }

    let connection; 

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Hapus transaksi terkait di tabel 'transactions'
        // Gunakan productId (integer) untuk query
        const deleteTransactionsSql = "DELETE FROM transactions WHERE id_inventories = ?";
        console.log("Executing deleteTransactionsSql query:", deleteTransactionsSql);
        console.log("Values:", [productId]); 
        const [transactionsResult] = await connection.execute(deleteTransactionsSql, [productId]);
        console.log(`Deleted ${transactionsResult.affectedRows} transactions for inventory ID ${productId}`);


        // 2. Hapus log dashboard yang terkait di tabel 'dashboard_logs'
        // Gunakan productId (integer) untuk query
        const deleteDashboardLogsSql = "DELETE FROM dashboard_logs WHERE id_produk_terlaris = ?";
        console.log("Executing deleteDashboardLogsSql query:", deleteDashboardLogsSql);
        console.log("Values:", [productId]); 
        const [dashboardLogsResult] = await connection.execute(deleteDashboardLogsSql, [productId]);
        console.log(`Deleted ${dashboardLogsResult.affectedRows} dashboard logs for inventory ID ${productId}`);


        // 3. Sekarang hapus item inventaris
        // Gunakan productId (integer) untuk query
        const deleteInventorySql = "DELETE FROM inventories WHERE id = ?";
        console.log("Executing deleteInventorySql query:", deleteInventorySql);
        console.log("Values:", [productId]); 
        const [inventoryResult] = await connection.execute(deleteInventorySql, [productId]);

        if (inventoryResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Item inventaris tidak ditemukan." });
        }

        await connection.commit();
        res.json({ message: "Item inventaris dan transaksi terkait berhasil dihapus!" });
    } catch (err) {
        // PERBAIKAN: Lebih detail dalam logging error Foreign Key
        if (connection) { // Pastikan koneksi ada sebelum rollback
            await connection.rollback();
        }
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            console.error("deleteInventory: Foreign Key Constraint Violation:", err.sqlMessage);
            return res.status(400).json({ message: "Gagal menghapus inventaris: Masih ada data terkait di tabel lain yang mencegah penghapusan. Pastikan semua transaksi, log, atau data lain yang mereferensikan produk ini telah dihapus." });
        }

        console.error("deleteInventory: Error during transaction:", err);
        res.status(500).json({ message: "Gagal menghapus inventaris.", error: err.message, sql: err.sql });
    } finally {
        if (connection) { // Pastikan koneksi ada sebelum dilepaskan
            connection.release();
        }
    }
};

// Fungsi getLocations ini sepertinya duplikat dengan LokasiGudangController.js
// Biasanya fungsi ini tidak diperlukan di sini jika sudah ada di controller lain.
// Jika Anda memang memanggil ini dari frontend, pastikan path di router benar.
// Tapi, untuk saat ini, saya juga akan memperbaikinya untuk konsistensi.
export const getLocations = async (req, res) => {
    try {
        // Mengubah alias untuk konsistensi dengan frontend jika diperlukan
        const sql = "SELECT id, nama AS name, alamat AS address FROM locations ORDER BY nama ASC;";
        // Menggunakan await db.query()
        const [results] = await db.query(sql);
        console.log("Backend - Data lokasi yang dikirim:", results);
        res.json(results);
    } catch (err) {
        console.error("Error fetching locations (from InventoryController):", err);
        res.status(500).json({ message: "Gagal mengambil data lokasi", error: err.message });
    }
};
