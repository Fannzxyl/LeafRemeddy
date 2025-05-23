// backend/controllers/TransactionController.js
import db from "../db.js";

// Ambil semua transaksi
export const getTransactions = (req, res) => {
  const { role, username } = req.user;

  const sql = role === "MANAGER"
    ? `SELECT 
         id, 
         username, 
         total, 
         status, 
         DATE_FORMAT(tanggal, '%Y-%m-%d %H:%i:%s') AS tanggal, 
         produk, 
         tipe, 
         user_input 
       FROM transactions 
       ORDER BY tanggal DESC`
    : `SELECT 
         id, 
         username, 
         total, 
         status, 
         DATE_FORMAT(tanggal, '%Y-%m-%d %H:%i:%s') AS tanggal, 
         produk, 
         tipe, 
         user_input 
       FROM transactions 
       WHERE username = ? 
       ORDER BY tanggal DESC`;

  const values = role === "MANAGER" ? [] : [username];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error fetching transactions:", err);
      return res.status(500).json({ message: "Gagal mengambil transaksi" });
    }
    res.json(result);
  });
};

// Buat transaksi baru
export const createTransaction = (req, res) => {
  const { total, produk, tipe } = req.body;
  const { username } = req.user;

  if (!total || isNaN(total)) {
    return res.status(400).json({ message: "Total harus berupa angka" });
  }
  if (!produk || !tipe) {
    return res.status(400).json({ message: "Produk dan tipe wajib diisi" });
  }

  const sql = `
    INSERT INTO transactions 
    (username, total, status, produk, tipe, user_input) 
    VALUES (?, ?, 'pending', ?, ?, ?)
  `;

  db.query(
    sql,
    [username, parseFloat(total), produk, tipe, username],
    (err, result) => {
      if (err) {
        console.error("Error inserting transaction:", err);
        return res.status(500).json({ message: "Gagal menambahkan transaksi" });
      }
      res.status(201).json({ 
        message: "Transaksi berhasil ditambahkan", 
        transactionId: result.insertId 
      });
    }
  );
};

// Approve transaksi
export const approveTransaction = (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM transactions WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Error finding transaction:", err);
      return res.status(500).json({ message: "Gagal memproses transaksi" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    db.query("UPDATE transactions SET status = 'approved' WHERE id = ?", [id], (err) => {
      if (err) {
        console.error("Error approving transaction:", err);
        return res.status(500).json({ message: "Gagal meng-approve transaksi" });
      }

      res.json({ 
        message: "Transaksi berhasil di-approve",
        transaction: {
          id: results[0].id,
          produk: results[0].produk,
          total: results[0].total
        }
      });
    });
  });
};

// Reject transaksi
export const rejectTransaction = (req, res) => {
  const { id } = req.params;

  db.query("UPDATE transactions SET status = 'rejected' WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("Error rejecting transaction:", err);
      return res.status(500).json({ message: "Gagal menolak transaksi" });
    }
    res.json({ message: "Transaksi berhasil ditolak" });
  });
};