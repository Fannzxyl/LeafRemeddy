// controllers/InventoryController.js
import db from "../db.js";

// Fungsi untuk mendapatkan semua item inventaris
export const getInventory = (req, res) => {
    const sql = "SELECT * FROM inventories";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching inventory:", err);
            return res.status(500).json({ message: "Gagal mengambil data inventaris" });
        }
        res.json(results);
    });
};

// Fungsi untuk mendapatkan item inventaris berdasarkan ID
export const getInventoryById = (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM inventories WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error fetching inventory by ID:", err);
            return res.status(500).json({ message: "Gagal mengambil item inventaris" });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "Item inventaris tidak ditemukan" });
        }
        res.json(result[0]);
    });
};

export const createInventory = (req, res) => {
    console.log("createInventory: Function entered.");
    console.log("createInventory: Raw req.user at function start:", req.user); // Log req.user
    console.log("createInventory: req.userIdFromToken (from middleware):", req.userIdFromToken); // Log properti baru
    console.log("createInventory: req.userRoleFromToken (from middleware):", req.userRoleFromToken); // Log properti baru

    const { namaProduk, kategori, stok, satuan, status, id_lokasi } = req.body;

    // AMBIL userId dan userRole DARI PROPERTI EKSPLISIT YANG DISET OLEH MIDDLEWARE
    const userId = req.userIdFromToken;
    const userRole = req.userRoleFromToken;

    // Validasi informasi pengguna
    if (userId === null || userRole === null || userId === undefined || userRole === undefined) {
        console.error("createInventory: User ID or Role is missing from request after extraction.");
        return res.status(401).json({ message: "Informasi pengguna tidak lengkap. Mohon login ulang." });
    }

    if (!namaProduk || !kategori || !satuan || !id_lokasi) {
        return res.status(400).json({ message: "Semua field wajib diisi" });
    }
    if (isNaN(stok) || parseInt(stok) < 0) {
        return res.status(400).json({ message: "Stok harus berupa angka positif" });
    }

    if (userRole === "MANAGER") {
        const insertQuery = "INSERT INTO inventories (namaProduk, kategori, stok, satuan, status, id_lokasi) VALUES (?, ?, ?, ?, ?, ?)";

        console.log("Executing createInventory (MANAGER) query:", insertQuery);
        console.log("Values:", [namaProduk, kategori, parseInt(stok), satuan, status || "ACTIVE", parseInt(id_lokasi)]);

        db.query(
            insertQuery,
            [namaProduk, kategori, parseInt(stok), satuan, status || "ACTIVE", parseInt(id_lokasi)],
            (err, result) => {
                if (err) {
                    console.error("Error creating inventory item (MANAGER):", err);
                    return res.status(500).json({ message: "Gagal menambahkan item inventaris", error: err.message, sqlState: err.sqlState, sqlMessage: err.sqlMessage, sql: err.sql });
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

                const insertProductQuery = "INSERT INTO inventories (namaProduk, kategori, stok, satuan, status, id_lokasi) VALUES (?, ?, ?, ?, ?, ?)";
                const productValues = [namaProduk, kategori, 0, satuan, 'INACTIVE', parseInt(id_lokasi)];

                console.log("Executing createInventory (STAZ - product) query:", insertProductQuery);
                console.log("Values:", productValues);

                connection.query(
                    insertProductQuery,
                    productValues,
                    (err, productResult) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
                                console.error("createInventory (STAZ): Error creating temp product:", err);
                                if (productResult && productResult.insertId) {
                                    db.query("DELETE FROM inventories WHERE id = ?", [productResult.insertId], (delErr) => {
                                        if (delErr) console.error("Error cleaning up temp product after failed transaction:", delErr);
                                    });
                                }
                                res.status(500).json({ message: "Gagal membuat produk sementara", error: err.message, sql: err.sql });
                            });
                        }

                        const newProductId = productResult.insertId;

                        const insertTransactionQuery = "INSERT INTO transactions (id_inventories, jumlah, tipe, status, tanggal, created_by, transaction_type, namaProduk, kategori, satuan, id_lokasi, requested_stok) VALUES (?, ?, 'masuk', 'pending', CURDATE(), ?, 'add_product', ?, ?, ?, ?, ?)";
                        const transactionValues = [
                            newProductId,
                            parseInt(stok),
                            userId, // Gunakan userId yang baru dan sudah divalidasi di awal fungsi
                            namaProduk,
                            kategori,
                            satuan,
                            parseInt(id_lokasi),
                            parseInt(stok)
                        ];

                        console.log("Executing createInventory (STAZ - transaction) query:", insertTransactionQuery);
                        console.log("Values:", transactionValues);

                        connection.query(
                            insertTransactionQuery,
                            transactionValues,
                            (err, transactionResult) => {
                                if (err) {
                                    return connection.rollback(() => {
                                        connection.release();
                                        console.error("createInventory (STAZ): Error creating approval transaction:", err);
                                        db.query("DELETE FROM inventories WHERE id = ?", [newProductId], (delErr) => {
                                            if (delErr) console.error("Error cleaning up temp product after failed transaction:", delErr);
                                        });
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
    }
};

export const updateInventory = (req, res) => {
    const { id } = req.params;
    const { namaProduk, kategori, stok, satuan, status, id_lokasi } = req.body;

    // AMBIL userRole DARI PROPERTI EKSPLISIT YANG DISET OLEH MIDDLEWARE
    const userRole = req.userRoleFromToken;

    if (!userRole || userRole !== "MANAGER") {
        console.log("UpdateInventory: Access denied. Role not MANAGER or userRole is missing:", userRole);
        return res.status(403).json({ message: "Akses ditolak. Hanya Manager yang dapat mengupdate inventaris." });
    }

    if (!namaProduk || !kategori || !satuan || !id_lokasi) {
        return res.status(400).json({ message: "Semua field wajib diisi" });
    }
    if (isNaN(stok) || parseInt(stok) < 0) {
        return res.status(400).json({ message: "Stok harus berupa angka positif!" });
    }

    const sql = "UPDATE inventories SET namaProduk = ?, kategori = ?, stok = ?, satuan = ?, status = ?, id_lokasi = ? WHERE id = ?";

    console.log("Executing updateInventory query:", sql);
    console.log("Values:", [namaProduk, kategori, parseInt(stok), satuan, status, parseInt(id_lokasi), id]);

    db.query(
        sql,
        [namaProduk, kategori, parseInt(stok), satuan, status, parseInt(id_lokasi), id],
        (err, result) => {
            if (err) {
                console.error("Error updating inventory:", err);
                return res.status(500).json({ message: "Gagal mengupdate inventaris", error: err.message, sqlState: err.sqlState, sqlMessage: err.sqlMessage, sql: err.sql });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Item inventaris tidak ditemukan" });
            }
            res.json({ message: "Item inventaris berhasil diupdate" });
        }
    );
};


export const deleteInventory = (req, res) => {
    const { id } = req.params;
    // AMBIL userRole DARI PROPERTI EKSPLISIT YANG DISET OLEH MIDDLEWARE
    const userRole = req.userRoleFromToken;

    if (!userRole || userRole !== "MANAGER") {
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

                // Hapus log dashboard yang terkait di tabel 'dashboard_logs'
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

                    // 2. Sekarang hapus item inventaris
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
    const sql = "SELECT * FROM locations";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching locations:", err);
            return res.status(500).json({ message: "Gagal mengambil data lokasi" });
        }
        res.json(results);
    });
};