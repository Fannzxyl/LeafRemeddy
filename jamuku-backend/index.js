// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db.js"; // Pastikan ini mengacu ke db.js yang baru
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT = process.env.APP_PORT || 5000;

// Global middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Test database connection - DIUBAH KE ASYNC/AWAIT
(async () => { // Gunakan Immediately Invoked Async Function Expression (IIAFE)
    let connection; // Deklarasikan di luar try
    try {
        connection = await db.getConnection(); // Dapatkan koneksi secara async
        console.log("✅ Terkoneksi ke database MySQL (leaff-remeddy) melalui Connection Pool");
    } catch (err) {
        console.error("❌ Gagal terhubung ke database MySQL:", err.message);
    } finally {
        if (connection) connection.release(); // Pastikan koneksi dilepaskan
    }
})();

// Import routes (pastikan rute TransactionRoute tetap ada jika Anda punya API transaksi terpisah)
import AuthRoute from "./routes/AuthRoute.js";
import TransactionRoute from "./routes/TransactionRoute.js"; // JIKA ANDA MEMILIKI API TRANSAKSI
import LokasiGudangRoute from "./routes/LokasiGudangRoute.js";
import InventoryRoute from "./routes/InventoryRoute.js";
import UserRoute from "./routes/UserRoute.js";
import DashboardRoute from "./routes/DashboardRoute.js";

// Mount routes with /api prefix and logging
app.use("/api", (req, res, next) => {
    console.log(`Incoming request to /api: ${req.method} ${req.originalUrl}`);
    next();
});

// Menggunakan rute-rute
app.use("/api", AuthRoute);
app.use("/api", TransactionRoute); // JIKA ANDA MEMILIKI API TRANSAKSI
app.use("/api", LokasiGudangRoute);
app.use("/api", InventoryRoute);
app.use("/api", UserRoute);
app.use("/api/dashboard", DashboardRoute);

// Test endpoint
app.get("/", (req, res) => {
    res.json({
        message: "🚀 Server is running!",
        endpoints: {
            auth: "/api/auth",
            inventory: "/api/inventory",
            users: "/api/users",
            // transactions: "/api/transactions", // 
            locations: "/api/locations",
            dashboard: "/api/dashboard"
        }
    });
});

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
    console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard`);
});