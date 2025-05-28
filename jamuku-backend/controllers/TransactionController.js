import db from "../db.js";

// GET all transactions
export const getTransactions = (req, res) => {
  const { role, id } = req.user;

  const baseQuery = `SELECT t.id, t.tanggal, t.jumlah, t.tipe, t.status, 
                           inv.namaProduk AS nama_produk, 
                           loc.nama AS nama_lokasi, 
                           u.username AS created_by, 
                           appr.username AS approved_by 
                     FROM transactions t 
                     JOIN inventories inv ON t.id_inventories = inv.id 
                     LEFT JOIN locations loc ON inv.id_lokasi = loc.id 
                     LEFT JOIN users u ON t.created_by = u.id 
                     LEFT JOIN users appr ON t.approved_by = appr.id`;

  const sql = role === "MANAGER" ? `${baseQuery} ORDER BY t.tanggal DESC` : `${baseQuery} WHERE t.created_by = ? ORDER BY t.tanggal DESC`;

  const values = role === "MANAGER" ? [] : [id];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error fetching transactions:", err);
      return res.status(500).json({ message: "Gagal mengambil transaksi" });
    }
    res.json(result);
  });
};

// CREATE transaction
export const createTransaction = (req, res) => {
  const { id_inventories, jumlah, tipe, tanggal } = req.body;
  const created_by = req.user.id;

  if (!id_inventories || !jumlah || !tipe || !tanggal) {
    return res.status(400).json({ message: "Semua data wajib diisi" });
  }

  const sql = `INSERT INTO transactions (id_inventories, jumlah, tipe, status, tanggal, created_by) VALUES (?, ?, ?, 'pending', ?, ?)`;

  db.query(sql, [id_inventories, jumlah, tipe, tanggal, created_by], (err, result) => {
    if (err) {
      console.error("Error inserting transaction:", err);
      return res.status(500).json({ message: "Gagal menambahkan transaksi" });
    }
    res.status(201).json({ message: "Transaksi berhasil ditambahkan", transactionId: result.insertId });
  });
};

// APPROVE transaction
export const approveTransaction = (req, res) => {
  const { id } = req.params;
  const approved_by = req.user.id;

  const sql = `UPDATE transactions SET status = 'approved', approved_by = ? WHERE id = ?`;

  db.query(sql, [approved_by, id], (err) => {
    if (err) {
      return res.status(500).json({ message: "Gagal menyetujui transaksi" });
    }
    res.json({ message: "Transaksi berhasil disetujui", id });
  });
};

// REJECT transaction
export const rejectTransaction = (req, res) => {
  const { id } = req.params;
  db.query("UPDATE transactions SET status = 'rejected' WHERE id = ?", [id], (err) => {
    if (err) {
      return res.status(500).json({ message: "Gagal menolak transaksi" });
    }
    res.json({ message: "Transaksi berhasil ditolak" });
  });
};