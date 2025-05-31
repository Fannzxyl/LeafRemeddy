// routes/DashboardRoute.js
import express from "express";
import {
  getInventorySummaryByCategory,
  getDailyTransactionSummary
} from "../controllers/InventoryController.js"; // Fungsi controller masih di InventoryController
import { verifyToken, verifyManager } from "../middleware/authMiddleware.js";

const router = express.Router();

// Rute untuk data chart dashboard
router.get("/inventory-summary-category", verifyToken, verifyManager, getInventorySummaryByCategory);
router.get("/daily-transaction-summary", verifyToken, verifyManager, getDailyTransactionSummary);

export default router;