// controllers/TransactionController.js
import db from "../db.js";

// Ambil semua transaksi
export const getTransactions = (req, res) => {
    const query = `
      SELECT
        t.*,
        u.username as created_by_name, -- PERBAIKAN DI SINI: Menggunakan 'username' dari tabel users
        a.username as approved_by_name  -- PERBAIKAN DI SINI: Menggunakan 'username' dari tabel users
      FROM transactions t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN users a ON t.approved_by = a.id
      ORDER BY t.tanggal DESC
    `;

    console.log("Executing getTransactions query:", query); // Log untuk debugging

    db.query(query, (err, results) => {
        if (err) {
            console.error("getTransactions: Error fetching transactions:", err);
            return res.status(500).json({ message: "Gagal mengambil data transaksi. Silakan cek log server untuk detail.", error: err.message });
        }
        console.log("getTransactions: Successfully fetched", results.length, "transactions."); // Log untuk debugging
        res.json(results);
    });
};

// Buat transaksi (umum, bukan dari STAZ create product)
export const createTransaction = (req, res) => {
    const { id_inventories, jumlah, tipe } = req.body;
    const created_by = req.user.id;

    if (!id_inventories || !jumlah || !tipe) {
        return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    const insertQuery = `
      INSERT INTO transactions (id_inventories, jumlah, tipe, status, tanggal, created_by, transaction_type)
      VALUES (?, ?, ?, 'pending', CURDATE(), ?, 'stock')
    `;

    db.query(insertQuery, [id_inventories, jumlah, tipe, created_by], (err, result) => {
        if (err) {
            console.error("createTransaction: Error inserting transaction:", err);
            return res.status(500).json({ message: "Gagal menambahkan transaksi" });
        }
        res.status(201).json({ message: "Transaksi berhasil dibuat", id: result.insertId });
    });
};

// Approve atau Reject transaksi
export const approveTransaction = (req, res) => {
    const { id } = req.params;
    const { action } = req.body;
    const approved_by = req.user.id;
    const managerRole = req.user.userRole;

    if (managerRole !== "MANAGER") {
        return res.status(403).json({ message: "Akses ditolak. Hanya Manager yang bisa melakukan aksi ini." });
    }

    db.getConnection((err, connection) => {
        if (err) {
            console.error("approveTransaction: Gagal mendapatkan koneksi dari pool:", err);
            return res.status(500).json({ message: "Gagal memulai transaksi (koneksi database)." });
        }

        connection.beginTransaction((err) => {
            if (err) {
                connection.release(); // Lepaskan koneksi jika beginTransaction gagal
                console.error("approveTransaction: Transaction begin error:", err);
                return res.status(500).json({ message: "Gagal memulai transaksi." });
            }

            const getTransactionQuery = `
          SELECT t.*, inv.stok as current_inventory_stok
          FROM transactions t
          LEFT JOIN inventories inv ON t.id_inventories = inv.id
          WHERE t.id = ? AND t.status = 'pending'
        `;

            connection.query(getTransactionQuery, [id], (err, transactions) => {
                if (err || transactions.length === 0) {
                    connection.rollback(() => {
                        connection.release();
                        if (err) console.error("approveTransaction: Error fetching transaction:", err);
                        return res.status(404).json({ message: "Transaksi tidak ditemukan atau sudah diproses." });
                    });
                    return;
                }

                const transaction = transactions[0];

                const updateTransactionStatusQuery = `
            UPDATE transactions SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?
          `;
                const newStatus = action === "approve" ? "approved" : "rejected";

                connection.query(updateTransactionStatusQuery, [newStatus, approved_by, id], (err) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error("approveTransaction: Error updating status:", err);
                            res.status(500).json({ message: "Gagal mengupdate status transaksi" });
                        });
                    }

                    if (action === "approve") {
                        if (transaction.transaction_type === "add_product") {
                            const activateProductQuery = `
                  UPDATE inventories SET status = 'ACTIVE', stok = ?, id_lokasi = ?, namaProduk = ?, kategori = ?, satuan = ? WHERE id = ?
                `;
                            connection.query(activateProductQuery, [
                                transaction.jumlah, // Menggunakan jumlah dari transaksi sebagai stok awal
                                transaction.id_lokasi,
                                transaction.namaProduk,
                                transaction.kategori,
                                transaction.satuan,
                                transaction.id_inventories
                            ], (err) => {
                                if (err) {
                                    return connection.rollback(() => {
                                        connection.release();
                                        console.error("approveTransaction: Error activating product:", err);
                                        res.status(500).json({ message: "Gagal mengaktifkan produk" });
                                    });
                                }

                                connection.commit((err) => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            connection.release();
                                            res.status(500).json({ message: "Gagal menyelesaikan approval" });
                                        });
                                    }
                                    connection.release();
                                    res.json({ message: "Produk baru berhasil disetujui dan diaktifkan." });
                                });
                            });
                        } else {
                            let newStock = transaction.tipe === "masuk"
                                ? transaction.current_inventory_stok + transaction.jumlah
                                : transaction.current_inventory_stok - transaction.jumlah;

                            if (newStock < 0) {
                                return connection.rollback(() => {
                                    connection.release();
                                    res.status(400).json({ message: "Stok tidak mencukupi untuk transaksi keluar" });
                                });
                            }

                            connection.query("UPDATE inventories SET stok = ? WHERE id = ?", [newStock, transaction.id_inventories], (err) => {
                                if (err) {
                                    return connection.rollback(() => {
                                        connection.release();
                                        console.error("approveTransaction: Error updating stock:", err);
                                        res.status(500).json({ message: "Gagal mengupdate stok" });
                                    });
                                }

                                connection.commit((err) => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            connection.release();
                                            res.status(500).json({ message: "Gagal menyelesaikan approval" });
                                        });
                                    }
                                    connection.release();
                                    res.json({ message: "Transaksi stok berhasil disetujui dan stok diperbarui." });
                                });
                            });
                        }
                    } else if (action === "reject") {
                        if (transaction.transaction_type === "add_product") {
                            // Untuk transaksi 'add_product' yang ditolak, hapus produk sementara yang dibuat
                            connection.query("UPDATE transactions SET id_inventories = NULL WHERE id = ?", [id], (err) => {
                                if (err) {
                                    return connection.rollback(() => {
                                        connection.release();
                                        res.status(500).json({ message: "Gagal memutus hubungan transaksi dengan produk" });
                                    });
                                }
                                connection.query("DELETE FROM inventories WHERE id = ?", [transaction.id_inventories], (err) => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            connection.release();
                                            console.error("approveTransaction: Error deleting temporary product:", err);
                                            res.status(500).json({ message: "Gagal menghapus produk sementara" });
                                        });
                                    }

                                    connection.commit((err) => {
                                        if (err) {
                                            return connection.rollback(() => {
                                                connection.release();
                                                res.status(500).json({ message: "Gagal menyelesaikan penolakan" });
                                            });
                                        }
                                        connection.release();
                                        res.json({ message: "Permintaan produk ditolak dan produk dihapus." });
                                    });
                                });
                            });
                        } else {
                            // Untuk transaksi stok yang ditolak, cukup ubah status transaksi
                            connection.commit((err) => {
                                if (err) {
                                    return connection.rollback(() => {
                                        connection.release();
                                        res.status(500).json({ message: "Gagal menyelesaikan penolakan" });
                                    });
                                }
                                connection.release();
                                res.json({ message: "Transaksi stok ditolak." });
                            });
                        }
                    } else {
                        connection.release();
                        res.status(400).json({ message: "Aksi tidak valid." });
                    }
                });
            });
        });
    });
};

// Alihkan rejectTransaction ke approveTransaction dengan aksi 'reject'
export const rejectTransaction = (req, res) => {
    req.body.action = 'reject';
    approveTransaction(req, res);
};