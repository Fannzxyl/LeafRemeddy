// routes/TransactionRoute.js
import express from 'express';
import db from '../db.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireManager, requireStaz } from '../middleware/roleMiddleware.js';

const router = express.Router();

// STAZ membuat transaksi (status default: pending)
router.post('/transactions', verifyToken, requireStaz, (req, res) => {
  const { username, total } = req.body;
  
  db.query(
    'INSERT INTO transactions (username, total, status) VALUES (?, ?, "pending")',
    [username, total],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.status(201).json({ 
        message: "Transaksi dibuat dengan status pending" 
      });
    }
  );
});

// MANAGER melihat semua transaksi
router.get('/transactions', verifyToken, requireManager, (req, res) => {
  db.query('SELECT * FROM transactions', (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(result);
  });
});

// MANAGER meng-approve transaksi
router.put('/transactions/:id/approve', verifyToken, requireManager, (req, res) => {
  const id = req.params.id;
  
  db.query(
    'UPDATE transactions SET status = "approved" WHERE id = ?',
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ 
        message: "Transaksi berhasil di-approve" 
      });
    }
  );
});

export default router;