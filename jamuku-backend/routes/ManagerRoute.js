import express from 'express';
import db from '../db.js';
import { verifyToken, requireManager } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/api/users', verifyToken, requireManager, (req, res) => {
  db.query('SELECT id, username, role FROM users', (err, results) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err });
    res.json(results);
  });
});

export default router;
