// controllers/DashboardController.js
import db from '../db.js'; // Ini berfungsi untuk mengimpor koneksi database pool yang berbasis Promise.

class DashboardController {
    // Ini berfungsi untuk mengambil ringkasan stok inventaris berdasarkan kategori.
    // Data yang dikembalikan cocok untuk Pie Chart.
    static async getInventorySummaryByCategory(req, res) {
        try {
            const query = `
                SELECT kategori, SUM(stok) as totalStock
                FROM inventories
                WHERE stok > 0 AND status = 'active'
                GROUP BY kategori
                ORDER BY totalStock DESC;
            `;
            const [rows] = await db.query(query); // Ini berfungsi untuk mengeksekusi query database.

            // Ini berfungsi untuk memformat data agar sesuai dengan format yang diharapkan oleh Pie Chart (name, value).
            const formattedData = rows.map(item => ({
                name: item.kategori || 'Tidak Berkategori',
                value: parseInt(item.totalStock) || 0
            }));

            res.json(formattedData); // Ini berfungsi untuk mengirimkan data ringkasan inventaris sebagai respons JSON.
        } catch (error) {
            // Ini berfungsi untuk menangani error jika gagal mengambil ringkasan inventaris.
            console.error('Error fetching inventory summary:', error);
            res.status(500).json({
                message: 'Gagal mengambil data ringkasan inventaris',
                error: error.message
            });
        }
    }

    // Ini berfungsi untuk mengambil ringkasan transaksi harian (masuk dan keluar)
    // dalam rentang hari tertentu, cocok untuk Bar Chart.
    static async getDailyTransactionSummary(req, res) {
        try {
            // Ini berfungsi untuk mendapatkan jumlah hari dari query parameter, default 7 hari.
            const days = parseInt(req.query.days) || 7;
            // Ini berfungsi untuk menghitung tanggal mulai dan tanggal akhir periode.
            const endDate = new Date(); // Hari ini
            const startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - (days - 1)); // Mundur 'days - 1' hari untuk mencakup hari ini.

            const query = `
                SELECT
                    DATE(t.tanggal) as date,
                    t.tipe as type,
                    SUM(t.jumlah) as total_quantity
                FROM transactions t
                JOIN inventories i ON t.id_inventories = i.id
                WHERE t.tanggal BETWEEN ? AND ?
                    AND t.status = 'approved'
                    AND (i.status = 'active' OR i.status IS NULL)
                GROUP BY DATE(t.tanggal), t.tipe
                ORDER BY DATE(t.tanggal) ASC;
            `;

            // Ini berfungsi untuk memformat tanggal ke string YYYY-MM-DD.
            const startDateFormat = startDate.toISOString().split('T')[0];
            const endDateFormat = endDate.toISOString().split('T')[0];

            const [transactionSummaryRaw] = await db.query(query, [startDateFormat, endDateFormat]);

            // Ini berfungsi untuk menginisialisasi peta tanggal dengan semua hari dalam rentang,
            // memastikan setiap tanggal memiliki entri meskipun tidak ada transaksi.
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

            // Ini berfungsi untuk mengisi data dari hasil query
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

            // Ini berfungsi untuk memformat data akhir untuk frontend (Bar Chart).
            const formattedData = Object.values(dateMap).map(item => ({
                date: item.date,
                'Total Masuk': item.masuk,
                'Total Keluar': item.keluar
            }));

            res.json(formattedData); // Ini berfungsi untuk mengirimkan data ringkasan transaksi sebagai respons JSON.
        } catch (error) {
            // Ini berfungsi untuk menangani error jika gagal mengambil ringkasan transaksi harian.
            console.error('Error fetching daily transaction summary:', error);
            res.status(500).json({
                message: 'Gagal mengambil data ringkasan transaksi harian',
                error: error.message
            });
        }
    }

    // Ini berfungsi untuk mengambil berbagai metrik penting untuk dashboard,
    // seperti total produk, stok menipis, transaksi pending, dan user pending.
    static async getDashboardMetrics(req, res) {
        try {
            // Ini berfungsi untuk menghitung total produk aktif.
            const [totalItemsResult] = await db.query('SELECT COUNT(*) as count FROM inventories WHERE status = "active";');
            const totalProducts = totalItemsResult[0].count;

            // Ini berfungsi untuk menghitung jumlah item dengan stok kurang dari 10 (dan lebih dari 0).
            const [lowStockItemsResult] = await db.query('SELECT COUNT(*) as count FROM inventories WHERE stok < 10 AND stok > 0 AND status = "active";');
            const lowStockItems = lowStockItemsResult[0].count;

            // Ini berfungsi untuk menghitung jumlah transaksi dengan status 'pending'.
            const [pendingTransactionsResult] = await db.query("SELECT COUNT(*) as count FROM transactions WHERE status = 'pending';");
            const pendingTransactions = pendingTransactionsResult[0].count;

            // Ini berfungsi untuk menghitung jumlah user dengan status 'pending'.
            const [pendingUsersResult] = await db.query("SELECT COUNT(*) as count FROM users WHERE status = 'pending';");
            const pendingUsers = pendingUsersResult[0].count;

            // Ini berfungsi untuk menghitung transaksi terbaru dalam 7 hari terakhir.
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const [recentTransactionsResult] = await db.query(`
                SELECT COUNT(*) as count
                FROM transactions t
                JOIN inventories i ON t.id_inventories = i.id
                WHERE t.tanggal >= ?
                    AND (i.status = 'active' OR i.status IS NULL);
            `, [sevenDaysAgo.toISOString().split('T')[0]]);
            const recentTransactions = recentTransactionsResult[0].count;

            // Ini berfungsi untuk menghitung total nilai stok inventaris.
            // Asumsi tidak ada kolom harga di inventories, jadi SUM(stok) digunakan sebagai nilai stok.
            // Kolom `harga` tidak ada di tabel `inventories` Anda, jadi hanya jumlah stok.
            const [inventoryValueResult] = await db.query('SELECT SUM(stok) as totalStockValue FROM inventories WHERE status = "active";');
            const inventoryValue = inventoryValueResult[0].totalStockValue || 0;

            // Ini berfungsi untuk mengirimkan semua metrik dashboard sebagai respons JSON.
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
            // Ini berfungsi untuk menangani error jika gagal mengambil metrik dashboard.
            console.error('Error fetching dashboard metrics:', error);
            res.status(500).json({
                message: 'Gagal mengambil data metrik dashboard',
                error: error.message
            });
        }
    }

    // Ini berfungsi untuk mengambil daftar aktivitas transaksi terbaru.
    static async getRecentActivities(req, res) {
        try {
            // Ini berfungsi untuk mendapatkan batas jumlah aktivitas dari query parameter, default 10.
            const limit = parseInt(req.query.limit) || 10;

            const query = `
                SELECT
                    t.id AS id,
                    t.tipe AS type,
                    t.jumlah AS quantity,
                    t.status,
                    DATE_FORMAT(t.tanggal, '%Y-%m-%d') AS createdAt,
                    COALESCE(i.namaProduk, 'Produk Tidak Ditemukan') AS productName,
                    u.username,
                    i.status AS productStatus
                FROM transactions t
                JOIN inventories i ON t.id_inventories = i.id
                JOIN users u ON t.created_by = u.id
                WHERE (i.status = 'active' OR i.status IS NULL)
                ORDER BY t.tanggal DESC, t.id DESC
                LIMIT ?;
            `;
            const [recentTransactions] = await db.query(query, [limit]); // Ini berfungsi untuk mengeksekusi query.

            // Ini berfungsi untuk memformat data aktivitas untuk tampilan frontend.
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

            res.json(activities); // Ini berfungsi untuk mengirimkan daftar aktivitas terbaru sebagai respons JSON.
        } catch (error) {
            // Ini berfungsi untuk menangani error jika gagal mengambil aktivitas terbaru.
            console.error('Error fetching recent activities:', error);
            res.status(500).json({
                message: 'Gagal mengambil data aktivitas terbaru',
                error: error.message
            });
        }
    }

    // Ini berfungsi untuk mengambil daftar produk teratas berdasarkan jumlah stok.
    static async getTopProductsByStock(req, res) {
        try {
            // Ini berfungsi untuk mendapatkan batas jumlah produk dari query parameter, default 5.
            const limit = parseInt(req.query.limit) || 5;
            const query = `
                SELECT
                    id AS id,
                    namaProduk AS name,
                    kategori AS category,
                    stok AS stock,
                    id_lokasi AS locationId
                FROM
                    inventories
                WHERE
                    stok > 0 AND status = 'active'
                ORDER BY
                    stok DESC
                LIMIT ?;
            `;

            const [topProducts] = await db.query(query, [limit]); // Ini berfungsi untuk mengeksekusi query.

            res.json(topProducts); // Ini berfungsi untuk mengirimkan daftar produk teratas berdasarkan stok sebagai respons JSON.
        } catch (error) {
            // Ini berfungsi untuk menangani error jika gagal mengambil produk teratas berdasarkan stok.
            console.error('Error fetching top products:', error);
            res.status(500).json({
                message: 'Gagal mengambil data produk teratas',
                error: error.message
            });
        }
    }

    // Ini berfungsi untuk mengambil daftar produk terlaris (paling banyak keluar/terjual).
    static async getTopSellingProducts(req, res) {
        try {
            // Ini berfungsi untuk mendapatkan batas jumlah produk dari query parameter, default 3.
            const limit = parseInt(req.query.limit) || 3;

            const [rows] = await db.query(`
                SELECT
                    i.namaProduk,
                    SUM(t.jumlah) AS total_quantity_sold
                FROM
                    transactions t
                JOIN
                    inventories i ON t.id_inventories = i.id
                WHERE
                    t.tipe = 'keluar' AND t.status = 'approved'
                GROUP BY
                    i.namaProduk
                ORDER BY
                    total_quantity_sold DESC
                LIMIT ?
            `, [limit]);

            res.status(200).json(rows); // Ini berfungsi untuk mengirimkan daftar produk terlaris sebagai respons JSON.
        } catch (error) {
            // Ini berfungsi untuk menangani error jika gagal mengambil produk terlaris.
            console.error("Error fetching top selling products:", error);
            res.status(500).json({
                message: "Gagal mengambil data produk terlaris",
                error: error.message
            });
        }
    }
}

export default DashboardController;