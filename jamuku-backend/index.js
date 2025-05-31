// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db.js";
import cookieParser from 'cookie-parser'; // Pastikan ini diimpor jika Anda menggunakannya

dotenv.config();

const app = express();
const PORT = process.env.APP_PORT || 5000;

// Global middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000', // Pastikan CLIENT_URL diset di .env
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Untuk parsing application/x-www-form-urlencoded
app.use(cookieParser()); // Untuk parsing cookie

// Test database connection
db.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Gagal terhubung ke database MySQL:", err.message);
        // Jika gagal koneksi awal, mungkin lebih baik keluar dari aplikasi
        // process.exit(1); // Opsional: Aktifkan ini jika ingin server berhenti saat gagal koneksi DB
        return;
    }
    console.log("✅ Terkoneksi ke database MySQL (leaff-remeddy) melalui Connection Pool");
    if (connection) connection.release();
});

// Import routes
import AuthRoute from "./routes/AuthRoute.js";
import TransactionRoute from "./routes/TransactionRoute.js";
import LokasiGudangRoute from "./routes/LokasiGudangRoute.js";
import InventoryRoute from "./routes/InventoryRoute.js";
import UserRoute from "./routes/UserRoute.js";
import DashboardRoute from "./routes/DashboardRoute.js"; // BARU: Pastikan ini diimpor

// Mount routes with /api prefix and logging
app.use("/api", (req, res, next) => {
    console.log(`Incoming request to /api: ${req.method} ${req.originalUrl}`);
    next();
});

// Menggunakan rute-rute aplikasi Anda
app.use("/api", AuthRoute);
app.use("/api", TransactionRoute);
app.use("/api", LokasiGudangRoute);
app.use("/api", InventoryRoute);
app.use("/api", UserRoute);
// PERUBAHAN KRUSIAL UNTUK CHART: Mount DashboardRoute di bawah prefix /api/dashboard
app.use("/api/dashboard", DashboardRoute); 


// Test endpoint
app.get("/", (req, res) => {
    res.json({
        message: "🚀 Server is running!",
        endpoints: {
            auth: "/api/auth", // Jika AuthRoute Anda punya /auth endpoint
            inventory: "/api/inventory",
            users: "/api/users",
            transactions: "/api/transactions",
            locations: "/api/locations", // Menggunakan 'locations' yang lebih spesifik
            dashboard: "/api/dashboard" // Menambahkan endpoint dashboard
        }
    });
});

// Error handling middleware (tempatkan ini setelah semua rute)
app.use((err, req, res, next) => {
    console.error("❌ Server Error:", err.stack);
    res.status(500).json({
        success: false,
        message: "❌ Terjadi kesalahan server internal."
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard`); // Log untuk Dashboard API
});