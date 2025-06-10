// C:\LeafRemedy\jamuku-backend\controllers\DashboardController.js
import db from '../db.js'; // Mengimpor koneksi pool (promise-style) dari db.js

class DashboardController {
  // Get inventory summary by category
  static async getInventorySummaryByCategory(req, res) {
    try {
      const query = `
        SELECT kategori, SUM(stok) as totalStock
        FROM inventories
        WHERE stok > 0 AND status = 'ACTIVE'
        GROUP BY kategori
        ORDER BY totalStock DESC;
      `;
      // PERBAIKAN: Mengganti db.promise().query() menjadi db.query()
      const [rows] = await db.query(query); 

      const formattedData = rows.map(item => ({
        name: item.kategori || 'Tidak Berkategori',
        value: parseInt(item.totalStock) || 0
      }));

      res.json(formattedData);
    } catch (error) {
      console.error('Error fetching inventory summary:', error);
      res.status(500).json({
        message: 'Gagal mengambil data ringkasan inventaris',
        error: error.message
      });
    }
  }

  // Get daily transaction summary - FIXED VERSION
  static async getDailyTransactionSummary(req, res) {
    try {
      const days = parseInt(req.query.days) || 7;
      const endDate = new Date(); // Hari ini
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - (days - 1)); // Mundur 'days - 1' hari untuk mencakup hari ini

      const query = `
        SELECT 
            DATE(t.tanggal) as date, 
            t.tipe as type, 
            SUM(t.jumlah) as total_quantity
        FROM transactions t
        LEFT JOIN inventories i ON t.id_inventories = i.id
        WHERE t.tanggal BETWEEN ? AND ? 
          AND t.status = 'approved'
          AND (i.status = 'ACTIVE' OR i.status IS NULL)
        GROUP BY DATE(t.tanggal), t.tipe
        ORDER BY DATE(t.tanggal) ASC;
      `;
      
      const startDateFormat = startDate.toISOString().split('T')[0];
      const endDateFormat = endDate.toISOString().split('T')[0];

      // PERBAIKAN: Mengganti db.promise().query() menjadi db.query()
      const [transactionSummaryRaw] = await db.query(query, [startDateFormat, endDateFormat]);
      console.log("Backend Raw Transaction Summary (DashboardController - FIXED):", transactionSummaryRaw);

      // Inisialisasi dateMap untuk semua hari dalam range
      const dateMap = {};
      for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        dateMap[dateStr] = {
          date: dateStr,
          masuk: 0,
          keluar: 0
        };
      }

      // Populate data dari hasil query
      transactionSummaryRaw.forEach(item => {
        const itemDate = new Date(item.date);
        const dateKey = itemDate.toISOString().split('T')[0];

        if (dateMap[dateKey]) {
          if (item.type === 'masuk') {
            dateMap[dateKey].masuk = parseInt(item.total_quantity) || 0;
          } else if (item.type === 'keluar') {
            dateMap[dateKey].keluar = parseInt(item.total_quantity) || 0;
          }
        }
      });

      // Format data untuk frontend
      const formattedData = Object.values(dateMap).map(item => ({
        date: item.date,
        'Total Masuk': item.masuk,
        'Total Keluar': item.keluar
      }));

      console.log("Backend Formatted Transaction Data for Chart (DashboardController - FIXED):", formattedData);

      res.json(formattedData);
    } catch (error) {
      console.error('Error fetching daily transaction summary:', error);
      res.status(500).json({
        message: 'Gagal mengambil data ringkasan transaksi harian',
        error: error.message
      });
    }
  }

  // Get dashboard metrics
  static async getDashboardMetrics(req, res) {
    try {
      // PERBAIKAN: Mengganti db.promise().query() menjadi db.query() di setiap panggilan
      const [totalItemsResult] = await db.query('SELECT COUNT(*) as count FROM inventories WHERE status = "ACTIVE";');
      const totalProducts = totalItemsResult[0].count;

      const [lowStockItemsResult] = await db.query('SELECT COUNT(*) as count FROM inventories WHERE stok < 10 AND stok > 0 AND status = "ACTIVE";');
      const lowStockItems = lowStockItemsResult[0].count;

      const [pendingTransactionsResult] = await db.query("SELECT COUNT(*) as count FROM transactions WHERE status = 'pending';");
      const pendingTransactions = pendingTransactionsResult[0].count;

      const [pendingUsersResult] = await db.query("SELECT COUNT(*) as count FROM users WHERE status = 'pending';");
      const pendingUsers = pendingUsersResult[0].count;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const [recentTransactionsResult] = await db.query(`
        SELECT COUNT(*) as count 
        FROM transactions t
        LEFT JOIN inventories i ON t.id_inventories = i.id
        WHERE t.tanggal >= ? 
          AND (i.status = 'ACTIVE' OR i.status IS NULL);
      `, [sevenDaysAgo.toISOString().split('T')[0]]);
      const recentTransactions = recentTransactionsResult[0].count;

      const [inventoryValueResult] = await db.query('SELECT SUM(stok) as totalStockValue FROM inventories WHERE status = "ACTIVE";');
      const inventoryValue = inventoryValueResult[0].totalStockValue || 0;

      res.json({
        totalProducts,
        lowStockItems,
        pendingTransactions,
        pendingUsers,
        recentTransactions,
        inventoryValue,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({
        message: 'Gagal mengambil data metrik dashboard',
        error: error.message
      });
    }
  }

  // Get recent activities - FIXED VERSION
  static async getRecentActivities(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;

      const query = `
        SELECT
          t.id,
          t.tipe as type,
          t.jumlah as quantity,
          t.status,
          DATE_FORMAT(t.tanggal, '%Y-%m-%d') as createdAt,
          COALESCE(i.namaProduk, t.namaProduk) as productName,
          u.username,
          i.status as productStatus
        FROM transactions t
        LEFT JOIN inventories i ON t.id_inventories = i.id
        LEFT JOIN users u ON t.created_by = u.id
        WHERE (i.status = 'ACTIVE' OR i.status IS NULL)
        ORDER BY t.tanggal DESC, t.id DESC
        LIMIT ?;
      `;
      // PERBAIKAN: Mengganti db.promise().query() menjadi db.query()
      const [recentTransactions] = await db.query(query, [limit]);

      const activities = recentTransactions.map(transaction => ({
        id: transaction.id,
        type: transaction.type,
        quantity: transaction.quantity,
        status: transaction.status,
        productName: transaction.productName || 'Produk Tidak Diketahui',
        username: transaction.username || 'User Tidak Diketahui',
        createdAt: transaction.createdAt,
        description: `${transaction.type === 'masuk' ? 'Barang Masuk' : 'Barang Keluar'} - ${transaction.productName || 'Produk'} (${transaction.quantity} unit)`
      }));

      res.json(activities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      res.status(500).json({
        message: 'Gagal mengambil data aktivitas terbaru',
        error: error.message
      });
    }
  }

  // Get top products by stock
  static async getTopProductsByStock(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const query = `
        SELECT id, namaProduk AS name, kategori AS category, stok AS stock, id_lokasi AS locationId
        FROM inventories
        WHERE stok > 0 AND status = 'ACTIVE'
        ORDER BY stok DESC
        LIMIT ?;
      `;
      // PERBAIKAN: Mengganti db.promise().query() menjadi db.query()
      const [topProducts] = await db.query(query, [limit]);

      res.json(topProducts);
    } catch (error) {
      console.error('Error fetching top products:', error);
      res.status(500).json({
        message: 'Gagal mengambil data produk teratas',
        error: error.message
      });
    }
  }
}

export default DashboardController;
