  // routes/DashboardRoute.js
  import express from 'express';
  import DashboardController from '../controllers/DashboardController.js';
  import { verifyToken } from '../middleware/authMiddleware.js'; // Mengimpor named exports

  const router = express.Router();

  router.use(verifyToken); // Semua route dashboard memerlukan authentication (verifikasi token)

  router.get('/inventory-summary-category', DashboardController.getInventorySummaryByCategory);
  router.get('/daily-transaction-summary', DashboardController.getDailyTransactionSummary); // DIAKTIFKAN KEMBALI
  router.get('/metrics', DashboardController.getDashboardMetrics);
  router.get('/recent-activities', DashboardController.getRecentActivities); // DIAKTIFKAN KEMBALI
  router.get('/top-products', DashboardController.getTopProductsByStock);

  export default router;