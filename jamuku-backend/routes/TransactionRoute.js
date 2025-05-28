// backend/routes/TransactionRoute.js
import express from "express";
import {
  getTransactions,
  createTransaction,
  approveTransaction,
  rejectTransaction, // Tambahan jika ingin reject
} from "../controllers/TransactionController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// STAZ & MANAGER: Lihat semua transaksi
router.get("/transactions", verifyToken, getTransactions);

// STAZ: Buat transaksi (status awal 'pending')
router.post("/transactions", verifyToken, authorizeRoles("STAZ"), createTransaction);

// MANAGER: Setujui transaksi
router.put("/transactions/:id/approve", verifyToken, authorizeRoles("MANAGER"), approveTransaction);

// MANAGER: Tolak transaksi (opsional)
router.put("/transactions/:id/reject", verifyToken, authorizeRoles("MANAGER"), rejectTransaction);

export default router;