// C:\LeafRemedy\jamuku-backend\controllers\InventoryController.js
import db from "../db.js"; // Mengimpor koneksi pool (callback-style) dari db.js

// Fungsi untuk mendapatkan semua inventaris/produk
export const getInventory = (req, res) => {
    const { userRole } = req.user; // Mengakses userRole dari token
    const query =
        userRole === "MANAGER"
            ? `SELECT inv.id, inv.namaProduk AS name, inv.kategori, inv.stok, inv.satuan, inv.status, inv.id_lokasi, loc.nama AS lokasi
               FROM inventories inv
               LEFT JOIN locations loc ON inv.id_lokasi = loc.id
               ORDER BY inv.id DESC`
            : `SELECT inv.id, inv.namaProduk AS name, inv.kategori, inv.stok, inv.satuan, inv.status, inv.id_lokasi, loc.nama AS lokasi
               FROM inventories inv
               LEFT JOIN locations loc ON inv.id_lokasi = loc.id
               WHERE inv.status = 'ACTIVE'
               ORDER BY inv.id DESC`;

    db.query(query, (err, results) => { // Menggunakan db.query dengan callback
        if (err) {
            console.error("Error fetching inventory:", err);
            return res.status(500).json({ message: "Gagal mengambil inventaris", error: err.message });
        }
        res.json(results); // Mengembalikan array objek
    });
};

export const getInventoryById = (req, res) => {
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

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error("Error fetching inventory by ID:", err);
            return res.status(500).json({ message: "Gagal mengambil item inventaris", error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "Item inventaris tidak ditemukan" });
        }
        res.json(results[0]); // Mengembalikan objek tunggal
    });
};

export const createInventory = (req, res) => {
    const { namaProduk, kategori, stok, satuan, status, id_lokasi } = req.body;
    const userId = req.userIdFromToken;
    const userRole = req.userRoleFromToken;

    if (!namaProduk || !kategori || !satuan || !id_lokasi) {
        return res.status(400).json({ message: "Semua field wajib diisi" });
    }
    if (isNaN(stok) || parseInt(stok) < 0) {
        return res.status(400).json({ message: "Stok harus berupa angka positif" });
    }

    if (userRole === "MANAGER") {
        const insertQuery = `
          INSERT INTO inventories (namaProduk, kategori, stok, satuan, status, id_lokasi)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.query(
            insertQuery,
            [namaProduk, kategori, parseInt(stok), satuan, status || "ACTIVE", parseInt(id_lokasi)],
            (err, result) => {
                if (err) {
                    console.error("Error creating inventory item (MANAGER):", err);
                    return res.status(500).json({ message: "Gagal menambahkan item inventaris" });
                }
                res.status(201).json({ message: "Item inventaris berhasil ditambahkan", id: result.insertId, type: "direct" });
            }
        );
    } else if (userRole === "STAZ") {
        db.getConnection((err, connection) => {
            if (err) {
                console.error("createInventory (STAZ): Gagal mendapatkan koneksi dari pool:", err);
                return res.status(500).json({ message: "Gagal memulai transaksi (koneksi database)." });
            }

            connection.beginTransaction((err) => {
                if (err) {
                    connection.release();
                    console.error("createInventory (STAZ): Transaction begin error:", err);
                    return res.status(500).json({ message: "Gagal memulai transaksi." });
                }

                const insertProductQuery = `
                    INSERT INTO inventories (namaProduk, kategori, stok, satuan, status, id_lokasi)
                    VALUES (?, ?, 0, ?, 'INACTIVE', ?)
                `;
                connection.query(
                    insertProductQuery,
                    [namaProduk, kategori, satuan, parseInt(id_lokasi)],
                    (err, productResult) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
                                console.error("createInventory (STAZ): Error creating temp product:", err);
                                res.status(500).json({ message: "Gagal membuat produk sementara", error: err.message, sql: err.sql });
                            });
                        }

                        const newProductId = productResult.insertId;

                        const insertTransactionQuery = `
                            INSERT INTO transactions (
                                id_inventories, jumlah, tipe, status, tanggal, created_by, transaction_type,
                                namaProduk, kategori, satuan, id_lokasi, requested_stok
                            )
                            VALUES (?, ?, 'masuk', 'pending', CURDATE(), ?, 'add_product', ?, ?, ?, ?, ?)
                        `;
                        connection.query(
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
                            ],
                            (err, transactionResult) => {
                                if (err) {
                                    return connection.rollback(() => {
                                        connection.release();
                                        console.error("createInventory (STAZ): Error creating approval transaction:", err);
                                        res.status(500).json({ message: "Gagal membuat permintaan approval", error: err.message, sql: err.sql });
                                    });
                                }

                                connection.commit((err) => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            connection.release();
                                            console.error("createInventory (STAZ): Transaction commit error:", err);
                                            res.status(500).json({ message: "Gagal menyelesaikan transaksi" });
                                        });
                                    }
                                    connection.release();
                                    res.status(201).json({
                                        message: "Permintaan penambahan produk telah dikirim untuk approval",
                                        id: newProductId,
                                        type: "approval_needed",
                                    });
                                });
                            }
                        );
                    }
                );
            });
        });
    } else {
        res.status(403).json({ message: "Akses ditolak. Peran tidak diizinkan untuk membuat inventaris." });
    }
};

export const updateInventory = (req, res) => {
    const { id } = req.params;
    const { namaProduk, kategori, stok, satuan, status, id_lokasi } = req.body;
    const userRole = req.user.userRole;

    if (userRole !== "MANAGER") {
        if (userRole === "STAZ") {
            // Untuk STAZ, kita akan memastikan mereka tidak bisa mengubah status atau stok.
            // Ini akan membutuhkan async/await untuk query db.promise().query
            // Untuk saat ini, kita langsung tolak jika mencoba mengubah status atau stok.
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
    db.query(
        sql,
        [namaProduk, kategori, parseInt(stok), satuan, status, parseInt(id_lokasi), id],
        (err, result) => {
            if (err) {
                console.error("Error updating inventory:", err);
                return res.status(500).json({ message: "Gagal mengupdate inventaris", error: err.message, sqlState: err.sqlState, sqlMessage: err.sqlMessage, sql: err.sql });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Item inventaris tidak ditemukan atau tidak ada perubahan" });
            }
            res.json({ message: "Item inventaris berhasil diupdate" });
        }
    );
};


export const deleteInventory = (req, res) => {
    const { id } = req.params;
    const userRole = req.user.userRole;

    if (userRole !== "MANAGER") {
        console.log("DeleteInventory: Access denied. Role not MANAGER or userRole is missing:", userRole);
        return res.status(403).json({ message: "Akses ditolak. Hanya Manager yang dapat menghapus inventaris." });
    }

    db.getConnection((err, connection) => {
        if (err) {
            console.error("deleteInventory: Gagal mendapatkan koneksi dari pool:", err);
            return res.status(500).json({ message: "Gagal memulai transaksi penghapusan (koneksi database)." });
        }

        connection.beginTransaction((err) => {
            if (err) {
                connection.release();
                console.error("deleteInventory: Transaction begin error:", err);
                return res.status(500).json({ message: "Gagal memulai transaksi penghapusan." });
            }

            // 1. Hapus transaksi terkait di tabel 'transactions'
            const deleteTransactionsSql = "DELETE FROM transactions WHERE id_inventories = ?";
            console.log("Executing deleteTransactionsSql query:", deleteTransactionsSql);
            console.log("Values:", [id]);

            connection.query(deleteTransactionsSql, [id], (err, transactionsResult) => {
                if (err) {
                    return connection.rollback(() => {
                        connection.release();
                        console.error("deleteInventory: Error deleting associated transactions:", err);
                        return res.status(500).json({ message: "Gagal menghapus transaksi terkait produk.", error: err.message, sql: err.sql });
                    });
                }

                // 2. Hapus log dashboard yang terkait di tabel 'dashboard_logs'
                const deleteDashboardLogsSql = "DELETE FROM dashboard_logs WHERE id_produk_terlaris = ?";
                console.log("Executing deleteDashboardLogsSql query:", deleteDashboardLogsSql);
                console.log("Values:", [id]);

                connection.query(deleteDashboardLogsSql, [id], (err, dashboardLogsResult) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error("deleteInventory: Error deleting associated dashboard logs:", err);
                            return res.status(500).json({ message: "Gagal menghapus log dashboard terkait produk.", error: err.message, sql: err.sql });
                        });
                    }

                    // 3. Sekarang hapus item inventaris
                    const deleteInventorySql = "DELETE FROM inventories WHERE id = ?";
                    console.log("Executing deleteInventorySql query:", deleteInventorySql);
                    console.log("Values:", [id]);

                    connection.query(deleteInventorySql, [id], (err, inventoryResult) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
                                console.error("deleteInventory: Error deleting inventory item:", err);
                                return res.status(500).json({ message: "Gagal menghapus inventaris.", error: err.message, sql: err.sql });
                            });
                        }

                        if (inventoryResult.affectedRows === 0) {
                            return connection.rollback(() => {
                                connection.release();
                                res.status(404).json({ message: "Item inventaris tidak ditemukan." });
                            });
                        }

                        connection.commit((err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release();
                                    console.error("deleteInventory: Transaction commit error:", err);
                                    res.status(500).json({ message: "Gagal menyelesaikan penghapusan." });
                                });
                            }
                            connection.release();
                            res.json({ message: "Item inventaris dan transaksi terkait berhasil dihapus!" });
                        });
                    });
                });
            });
        });
    });
};

export const getLocations = (req, res) => {
    // Ubah alias untuk konsistensi dengan frontend
    const sql = "SELECT id, nama AS name, alamat AS address FROM locations ORDER BY nama ASC;";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching locations:", err);
            return res.status(500).json({ message: "Gagal mengambil data lokasi", error: err.message });
        }
        console.log("Backend - Data lokasi yang dikirim:", results); // Debug log
        res.json(results);
    });
};