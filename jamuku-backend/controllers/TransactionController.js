// controllers/TransactionController.js
import db from "../db.js"; // Pastikan ini mengarah ke pool koneksi MySQL Anda

// Ambil semua transaksi
export const getTransactions = async (req, res) => {
    try {
        const query = `
            SELECT
                t.id, t.id_inventories AS product_id, t.jumlah, t.tipe, t.status, t.tanggal, t.transaction_type,
                t.namaProduk, t.requested_stok, t.id_lokasi,
                u.username as created_by_name,
                a.username as approved_by_name,
                l.nama as lokasi_nama,
                l.alamat as lokasi_alamat
            FROM transactions t
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN users a ON t.approved_by = a.id
            LEFT JOIN locations l ON t.id_lokasi = l.id
            ORDER BY t.tanggal DESC
        `;

        console.log("Executing getTransactions query:", query);

        const [results] = await db.query(query);

        console.log("getTransactions: Successfully fetched", results.length, "transactions.");
        res.json(results);
    } catch (err) {
        console.error("getTransactions: Error fetching transactions:", err);
        res.status(500).json({ message: "Gagal mengambil data transaksi. Silakan cek log server untuk detail.", error: err.message });
    }
};

// Buat transaksi (umum: stok masuk/keluar)
export const createTransaction = async (req, res) => {
    const { productId, jumlah, tipe, lokasiId } = req.body;
    // PERBAIKAN PENTING: Gunakan req.user.userId dan req.user.userRole langsung dari objek user yang didekode
    const created_by = req.user.userId; 
    const userRole = req.user.userRole;

    console.log("createTransaction: Request Body:", req.body);
    console.log("createTransaction: Decoded User:", req.user);

    if (!productId || !jumlah || !tipe || !lokasiId) {
        console.error("createTransaction: Missing required fields:", { productId, jumlah, tipe, lokasiId });
        return res.status(400).json({ message: "Semua field wajib diisi" });
    }
    if (jumlah <= 0) {
        return res.status(400).json({ message: "Jumlah harus lebih dari 0" });
    }
    if (!['masuk', 'keluar'].includes(tipe)) {
        return res.status(400).json({ message: "Tipe transaksi tidak valid" });
    }

    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Pastikan nama kolom 'namaProduk', 'stok', 'satuan', 'id_lokasi', 'kategori' cocok dengan tabel 'inventories' Anda
        const [productCheckRows] = await connection.execute(
            'SELECT id, namaProduk, stok, satuan, id_lokasi, kategori FROM inventories WHERE id = ?',
            [productId]
        );

        if (productCheckRows.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ message: "Produk tidak ditemukan." });
        }
        const product = productCheckRows[0];

        // LOG UNTUK DEBUGGING: Melihat data produk yang diambil
        console.log("createTransaction: Product data fetched from inventories:", product);


        if (product.id_lokasi !== lokasiId) {
             console.warn(`Produk ID ${productId} sebenarnya di lokasi ${product.id_lokasi}, tapi transaksi dicatat untuk lokasi ${lokasiId}.`);
        }

        let transactionStatus = 'pending';
        let transactionType = 'normal'; 

        if (userRole === 'MANAGER') {
            transactionStatus = 'approved';

            let newStock = product.stok;
            if (tipe === 'masuk') {
                newStock += jumlah;
            } else if (tipe === 'keluar') {
                newStock -= jumlah;
                if (newStock < 0) {
                    await connection.rollback();
                    connection.release();
                    return res.status(400).json({ message: "Stok tidak mencukupi untuk transaksi keluar ini." });
                }
            }

            await connection.execute(
                'UPDATE inventories SET stok = ? WHERE id = ?',
                [newStock, productId]
            );
            console.log(`Stok produk ${product.namaProduk} (ID: ${productId}) diperbarui ke ${newStock}`);

        } else {
            transactionStatus = 'pending';
        }

        const insertTransactionQuery = `
            INSERT INTO transactions (id_inventories, jumlah, tipe, status, tanggal, created_by, id_lokasi, transaction_type, namaProduk, kategori, satuan, requested_stok)
            VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?)
        `;
        // PERBAIKAN: Mengubah nilai undefined/null menjadi null JS eksplisit
        const params = [
            productId,
            jumlah,
            tipe,
            transactionStatus,
            created_by, // created_by sekarang seharusnya memiliki nilai dari req.user.userId
            lokasiId,
            transactionType,
            product.namaProduk ?? null,
            product.kategori ?? null,
            product.satuan ?? null,
            jumlah // Ini adalah requested_stok
        ];
        // LOG UNTUK DEBUGGING: Melihat parameter yang akan di-bind
        console.log("createTransaction: INSERT Query Parameters:", params);


        const [insertResult] = await connection.execute(insertTransactionQuery, params);
        console.log("Transaction inserted:", insertResult.insertId);

        await connection.commit();

        const [userResRows] = await db.execute('SELECT username FROM users WHERE id = ?', [created_by]);
        const created_by_name = userResRows[0]?.username || 'Unknown User';

        res.status(201).json({
            message: `Transaksi berhasil dicatat dengan status: ${transactionStatus}.`,
            transaction: {
                id: insertResult.insertId,
                product_id: productId,
                jumlah: jumlah,
                tipe: tipe,
                status: transactionStatus,
                tanggal: new Date().toISOString().split('T')[0],
                created_by: created_by,
                lokasi_id: lokasiId,
                transaction_type: transactionType,
                namaProduk: product.namaProduk ?? null,
                kategori: product.kategori ?? null,
                satuan: product.satuan ?? null,
                requested_stok: jumlah,
                created_by_name: created_by_name
            },
            type: userRole === 'MANAGER' ? 'direct' : 'approval_needed'
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('createTransaction: Error during transaction:', error.message);
        res.status(500).json({ message: 'Server error saat mencatat transaksi.', error: error.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Approve atau Reject transaksi
export const approveTransaction = async (req, res) => {
    const { id } = req.params;
    const { action } = req.body;
    // PERBAIKAN PENTING: Gunakan req.user.userId dan req.user.userRole langsung dari objek user yang didekode
    const approved_by = req.user.userId;
    const managerRole = req.user.userRole;

    if (managerRole !== "MANAGER") {
        return res.status(403).json({ message: "Akses ditolak. Hanya Manager yang bisa melakukan aksi ini." });
    }

    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [transactionsRows] = await connection.execute(
            `SELECT t.*, inv.stok as current_inventory_stok,
                    inv.namaProduk, inv.kategori, inv.satuan, inv.id_lokasi
             FROM transactions t
             LEFT JOIN inventories inv ON t.id_inventories = inv.id
             WHERE t.id = ? AND t.status = 'pending'`,
            [id]
        );

        if (transactionsRows.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ message: "Transaksi tidak ditemukan atau sudah diproses." });
        }

        const transaction = transactionsRows[0];

        const updateTransactionStatusQuery = `
            UPDATE transactions SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?
        `;
        const newStatus = action === "approve" ? "approved" : "rejected";

        await connection.execute(updateTransactionStatusQuery, [newStatus, approved_by, id]);

        if (action === "approve") {
            if (transaction.transaction_type === "add_product") {
                const activateProductQuery = `
                    UPDATE inventories SET status = 'ACTIVE', stok = ?, id_lokasi = ?, namaProduk = ?, kategori = ?, satuan = ? WHERE id = ?
                `;
                await connection.execute(activateProductQuery, [
                    transaction.requested_stok,
                    transaction.id_lokasi,
                    transaction.namaProduk ?? null,
                    transaction.kategori ?? null,
                    transaction.satuan ?? null,
                    transaction.id_inventories
                ]);
                await connection.commit();
                connection.release();
                res.json({ message: "Produk baru berhasil disetujui dan diaktifkan." });
            } else { // Handle 'normal' type transactions (stock_change)
                let newStock = transaction.tipe === "masuk"
                    ? transaction.current_inventory_stok + transaction.jumlah
                    : transaction.current_inventory_stok - transaction.jumlah;

                if (newStock < 0) {
                    await connection.rollback();
                    connection.release();
                    return res.status(400).json({ message: "Stok tidak mencukupi untuk transaksi keluar" });
                }

                await connection.execute("UPDATE inventories SET stok = ? WHERE id = ?", [newStock, transaction.id_inventories]);

                await connection.commit();
                connection.release();
                res.json({ message: "Transaksi stok berhasil disetujui dan stok diperbarui." });
            }
        } else if (action === "reject") {
            if (transaction.transaction_type === "add_product") {
                await connection.execute("DELETE FROM inventories WHERE id = ?", [transaction.id_inventories]);
                await connection.execute("UPDATE transactions SET id_inventories = NULL WHERE id = ?", [id]);
                
                await connection.commit();
                connection.release();
                res.json({ message: "Permintaan produk ditolak dan produk dihapus." });
            } else {
                await connection.commit();
                connection.release();
                res.json({ message: "Transaksi stok ditolak." });
            }
        } else {
            connection.release();
            res.status(400).json({ message: "Aksi tidak valid." });
        }
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error("approveTransaction: Error during transaction processing:", error);
        res.status(500).json({ message: "Gagal memproses approval.", error: error.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};


// Alihkan rejectTransaction ke approveTransaction dengan aksi 'reject'
export const rejectTransaction = async (req, res) => {
    req.body.action = 'reject';
    await approveTransaction(req, res);
};
