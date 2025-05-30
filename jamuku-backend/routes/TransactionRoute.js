// backend/routes/TransactionRoute.js
import express from "express";
import {
  getTransactions,
  createTransaction,
  approveTransaction,
  rejectTransaction,
} from "../controllers/TransactionController.js";

// Pastikan ini diimpor dari authMiddleware.js
// KITA PERLU verifyUser untuk rute GET /transactions (lihat semua transaksi)
import { verifyToken, verifyUser, verifyManager } from "../middleware/authMiddleware.js";

const router = express.Router();

// 1. GET /api/transactions - Untuk melihat semua transaksi (oleh STAZ & MANAGER)
// Menggunakan verifyUser karena ini adalah rute umum untuk semua user yang terverifikasi.
router.get("/transactions", verifyToken, verifyUser, getTransactions);

// 2. POST /api/transactions - Untuk membuat transaksi baru (oleh STAZ)
// Asumsi createTransaction ini untuk STAZ meminta penambahan produk.
// Jika Anda punya roleMiddleware.js dengan authorizeRoles("STAZ"), gunakan itu.
// Jika tidak, verifyUser saja cukup jika backend Anda sudah menangani role di dalam controller.
router.post("/transactions", verifyToken, verifyUser, createTransaction); // Menggunakan verifyUser

// 3. PUT /api/transactions/:id/approve - Untuk menyetujui transaksi (oleh MANAGER)
router.put("/transactions/:id/approve", verifyToken, verifyManager, approveTransaction);

// 4. PUT /api/transactions/:id/reject - Untuk menolak transaksi (oleh MANAGER)
router.put("/transactions/:id/reject", verifyToken, verifyManager, rejectTransaction);

export default router;