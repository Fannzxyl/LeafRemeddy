// jamuku-backend/routes/DashboardRoute.js

import express from 'express';
import DashboardController from '../controllers/DashboardController.js';
import { verifyToken } from '../middleware/authMiddleware.js'; // Mengimpor named exports
import { requireManager } from '../middleware/roleMiddleware.js'; // Perbaikan: Mengimpor 'requireManager'

const router = express.Router();

router.use(verifyToken); // Semua route dashboard memerlukan authentication (verifikasi token)

// Route-route yang sudah ada
router.get('/inventory-summary-category', DashboardController.getInventorySummaryByCategory);
router.get('/daily-transaction-summary', DashboardController.getDailyTransactionSummary);
router.get('/metrics', DashboardController.getDashboardMetrics);
router.get('/recent-activities', DashboardController.getRecentActivities);
router.get('/top-products', DashboardController.getTopProductsByStock);

// --- FITUR BARU: Route untuk Top 3 Selling Products ---
// Menggunakan middleware 'requireManager' untuk membatasi akses ke Manager
router.get('/top-selling-products', requireManager, DashboardController.getTopSellingProducts);
// Jika Anda tidak menggunakan middleware 'requireManager' atau ingin semua user bisa mengakses,
// gunakan: router.get('/top-selling-products', DashboardController.getTopSellingProducts);
// --- AKHIR FITUR BARU ---

export default router;