// controllers/InventoryController.js
import db from "../db.js";

export const getInventory = (req, res) => {
  const { role } = req.user;
  const query =
    role === "MANAGER"
      ? "SELECT inv.*, loc.nama as lokasi FROM inventories inv LEFT JOIN locations loc ON inv.id_lokasi = loc.id ORDER BY inv.id DESC"
      : "SELECT inv.*, loc.nama as lokasi FROM inventories inv LEFT JOIN locations loc ON inv.id_lokasi = loc.id WHERE inv.status = 'ACTIVE' ORDER BY inv.id DESC";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching inventory:", err);
      return res.status(500).json({ message: "Gagal mengambil inventaris" });
    }
    res.json(results);
  });
};

export const getInventoryById = (req, res) => {
  const { id } = req.params;
  const { role } = req.user;

  let query = `
    SELECT inv.*, loc.nama as lokasi FROM inventories inv 
    LEFT JOIN locations loc ON inv.id_lokasi = loc.id 
    WHERE inv.id = ?`;

  if (role === "STAZ") {
    query += ` AND inv.status = 'ACTIVE'`;
  }

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error fetching inventory by ID:", err);
      return res.status(500).json({ message: "Gagal mengambil item inventaris" });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "Item inventaris tidak ditemukan" });
    }
    res.json(results[0]);
  });
};

export const createInventory = (req, res) => {
  const { namaProduk, kategori, stok, satuan, status, id_lokasi } = req.body;
  const userId = req.user.userId;
  const userRole = req.user.userRole;

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
                if (productResult && productResult.insertId) { // Pastikan productResult ada sebelum mengakses insertId
                  db.query("DELETE FROM inventories WHERE id = ?", [productResult.insertId], (delErr) => {
                    if (delErr) console.error("Error cleaning up temp product after failed transaction:", delErr);
                  });
                }
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
                userId, // Menggunakan userId dari req.user
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
  const userRole = req.user.userRole;

  if (userRole !== "MANAGER") {
    console.log("UpdateInventory: Access denied. Role not MANAGER or userRole is missing:", userRole);
    return res.status(403).json({ message: "Akses ditolak. Hanya Manager yang dapat mengupdate inventaris." });
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
        return res.status(404).json({ message: "Item inventaris tidak ditemukan" });
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
        // Ini perlu ada di database Anda jika tidak, akan ada error!
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
  const sql = "SELECT * FROM locations";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching locations:", err);
      return res.status(500).json({ message: "Gagal mengambil data lokasi" });
    }
    res.json(results);
  });
};

// Fungsi baru untuk chart
export const getInventorySummaryByCategory = (req, res) => {
  const query = `
    SELECT kategori, SUM(stok) AS total_stok
    FROM inventories
    WHERE status = 'ACTIVE'
    GROUP BY kategori
    ORDER BY total_stok DESC;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching inventory summary by category:", err);
      return res.status(500).json({ message: "Gagal mengambil ringkasan stok per kategori" });
    }
    res.json(results);
  });
};

// PERUBAHAN DI SINI: Query untuk data bulanan
export const getDailyTransactionSummary = (req, res) => {
  const query = `
    SELECT 
        DATE_FORMAT(tanggal, '%Y-%m') AS month_year,
        SUM(CASE WHEN tipe = 'masuk' THEN jumlah ELSE 0 END) AS total_masuk,
        SUM(CASE WHEN tipe = 'keluar' THEN jumlah ELSE 0 END) AS total_keluar
    FROM transactions
    WHERE tanggal >= CURDATE() - INTERVAL 6 MONTH AND status = 'approved' -- Mengambil data 6 bulan terakhir
    GROUP BY month_year
    ORDER BY month_year ASC;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching daily transaction summary:", err);
      return res.status(500).json({ message: "Gagal mengambil ringkasan transaksi harian" });
    }
    res.json(results);
  });
};