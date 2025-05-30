// controllers/TransactionController.js
import db from "../db.js";

// ... (fungsi getTransactions, createTransaction tetap sama) ...

// APPROVE or REJECT transaction
export const approveTransaction = (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'approve' atau 'reject'
  const approved_by = req.user.id;
  const managerRole = req.user.userRole; // Menggunakan userRole untuk konsistensi

  if (managerRole !== "MANAGER") {
    return res.status(403).json({ message: "Akses ditolak. Hanya Manager yang bisa melakukan aksi ini." });
  }

  // PERUBAHAN DI SINI: Dapatkan koneksi dari pool untuk transaksi
  db.getConnection((err, connection) => {
    if (err) {
      console.error("approveTransaction: Gagal mendapatkan koneksi dari pool:", err);
      return res.status(500).json({ message: "Gagal memulai transaksi (koneksi database)." });
    }

    connection.beginTransaction((err) => { // Gunakan 'connection.beginTransaction'
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

      connection.query(getTransactionQuery, [id], (err, transactions) => { // Gunakan 'connection.query'
        if (err) {
          return connection.rollback(() => {
            connection.release(); // Lepaskan koneksi setelah rollback
            console.error("approveTransaction: Error fetching transaction for approval:", err);
            res.status(500).json({ message: "Gagal mengambil detail transaksi" });
          });
        }

        if (transactions.length === 0) {
          return connection.rollback(() => {
            connection.release(); // Lepaskan koneksi setelah rollback
            res.status(404).json({ message: "Transaksi tidak ditemukan atau sudah diproses." });
          });
        }

        const transaction = transactions[0];

        if (action === 'approve') {
          const updateTransactionStatusQuery = `
            UPDATE transactions SET status = 'approved', approved_by = ?, approved_at = NOW() WHERE id = ?
          `;

          connection.query(updateTransactionStatusQuery, [approved_by, id], (err) => { // Gunakan 'connection.query'
            if (err) {
              return connection.rollback(() => {
                connection.release(); // Lepaskan koneksi setelah rollback
                console.error("approveTransaction: Error updating transaction status to approved:", err);
                res.status(500).json({ message: "Gagal mengupdate status transaksi" });
              });
            }

            if (transaction.transaction_type === 'add_product') {
              const activateProductQuery = `
                UPDATE inventories SET status = 'ACTIVE', stok = ?, id_lokasi = ?, namaProduk = ?, kategori = ?, satuan = ? WHERE id = ?
              `;
              connection.query(activateProductQuery, [ // Gunakan 'connection.query'
                transaction.jumlah,
                transaction.id_lokasi,
                transaction.namaProduk,
                transaction.kategori,
                transaction.satuan,
                transaction.id_inventories
              ], (err) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release(); // Lepaskan koneksi setelah rollback
                    console.error("approveTransaction: Error activating product after approval:", err);
                    res.status(500).json({ message: "Gagal mengaktifkan produk" });
                  });
                }

                connection.commit((err) => { // Gunakan 'connection.commit'
                  if (err) {
                    return connection.rollback(() => {
                      connection.release(); // Lepaskan koneksi setelah rollback
                      console.error("approveTransaction: Transaction commit error for add_product approval:", err);
                      res.status(500).json({ message: "Gagal menyelesaikan approval" });
                    });
                  }
                  connection.release(); // PENTING: Lepaskan koneksi setelah commit sukses
                  res.json({ message: "Produk baru berhasil disetujui dan diaktifkan." });
                });
              });
            } else { // Normal transaction
              let newStock;
              if (transaction.tipe === 'masuk') {
                newStock = transaction.current_inventory_stok + transaction.jumlah;
              } else {
                newStock = transaction.current_inventory_stok - transaction.jumlah;
                if (newStock < 0) {
                  return connection.rollback(() => {
                    connection.release(); // Lepaskan koneksi setelah rollback
                    res.status(400).json({ message: "Stok tidak mencukupi untuk transaksi keluar" });
                  });
                }
              }

              const updateStockQuery = `UPDATE inventories SET stok = ? WHERE id = ?`;

              connection.query(updateStockQuery, [newStock, transaction.id_inventories], (err) => { // Gunakan 'connection.query'
                if (err) {
                  return connection.rollback(() => {
                    connection.release(); // Lepaskan koneksi setelah rollback
                    console.error("approveTransaction: Error updating stock for normal transaction approval:", err);
                    res.status(500).json({ message: "Gagal mengupdate stok" });
                  });
                }

                connection.commit((err) => { // Gunakan 'connection.commit'
                  if (err) {
                    return connection.rollback(() => {
                      connection.release(); // Lepaskan koneksi setelah rollback
                      console.error("approveTransaction: Transaction commit error for normal transaction approval:", err);
                      res.status(500).json({ message: "Gagal menyelesaikan approval" });
                    });
                  }
                  connection.release(); // PENTING: Lepaskan koneksi setelah commit sukses
                  res.json({ message: "Transaksi stok berhasil disetujui dan stok diperbarui." });
                });
              });
            }
          });
        } else if (action === 'reject') {
          const updateTransactionStatusQuery = `
            UPDATE transactions SET status = 'rejected', approved_by = ?, approved_at = NOW() WHERE id = ?
          `;

          connection.query(updateTransactionStatusQuery, [approved_by, id], (err) => { // Gunakan 'connection.query'
            if (err) {
              return connection.rollback(() => {
                connection.release(); // Lepaskan koneksi setelah rollback
                console.error("approveTransaction: Error updating transaction status to rejected:", err);
                res.status(500).json({ message: "Gagal mengupdate status transaksi" });
              });
            }

            if (transaction.transaction_type === 'add_product') {
              const updateTransactionIdInventoriesQuery = `
                UPDATE transactions SET id_inventories = NULL WHERE id = ?
              `;

              connection.query(updateTransactionIdInventoriesQuery, [id], (err) => { // Gunakan 'connection.query'
                if (err) {
                  return connection.rollback(() => {
                    connection.release(); // Lepaskan koneksi setelah rollback
                    console.error("approveTransaction: Error setting id_inventories to NULL for rejected transaction:", err);
                    res.status(500).json({ message: "Gagal memutuskan hubungan transaksi dengan produk sementara." });
                  });
                }

                const deleteProductQuery = `DELETE FROM inventories WHERE id = ?`;

                connection.query(deleteProductQuery, [transaction.id_inventories], (err) => { // Gunakan 'connection.query'
                  if (err) {
                    return connection.rollback(() => {
                      connection.release(); // Lepaskan koneksi setelah rollback
                      console.error("approveTransaction: Error deleting temp product after rejection:", err);
                      res.status(500).json({ message: "Gagal menghapus produk sementara" });
                    });
                  }

                  connection.commit((err) => { // Gunakan 'connection.commit'
                    if (err) {
                      return connection.rollback(() => {
                        connection.release(); // Lepaskan koneksi setelah rollback
                        console.error("approveTransaction: Transaction commit error for add_product rejection:", err);
                        res.status(500).json({ message: "Gagal menyelesaikan penolakan" });
                      });
                    }
                    connection.release(); // PENTING: Lepaskan koneksi setelah commit sukses
                    res.json({ message: "Permintaan penambahan produk baru ditolak dan produk dihapus." });
                  });
                });
              });
            } else { // Normal transaction (stock in/out) that is rejected
              connection.commit((err) => { // Gunakan 'connection.commit'
                if (err) {
                  return connection.rollback(() => {
                    connection.release(); // Lepaskan koneksi setelah rollback
                    console.error("approveTransaction: Transaction commit error for normal transaction rejection:", err);
                    res.status(500).json({ message: "Gagal menyelesaikan penolakan" });
                  });
                }
                connection.release(); // PENTING: Lepaskan koneksi setelah commit sukses
                res.json({ message: "Transaksi stok ditolak." });
              });
            }
          });
        } else {
          connection.release(); // Lepaskan koneksi jika aksi tidak valid
          res.status(400).json({ message: "Aksi tidak valid." });
        }
      });
    });
  });
};

// ... (fungsi rejectTransaction tetap sama) ...
export const rejectTransaction = (req, res) => {
  const { id } = req.params;
  req.body.action = 'reject';
  approveTransaction(req, res);
};