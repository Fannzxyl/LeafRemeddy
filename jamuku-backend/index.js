import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db.js";

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.APP_PORT || 5000;

// Global middleware
app.use(cors());
app.use(express.json());

// Test database connection
db.connect((err) => {
  if (err) {
    console.error("❌ Failed to connect to database:", err.message);
  } else {
    console.log("✅ Connected to MySQL database");
  }
});

// Import routes
import AuthRoute from "./routes/AuthRoute.js";
import ManagerRoute from "./routes/ManagerRoute.js";
import TransactionRoute from "./routes/TransactionRoute.js";
import LokasiGudangRoute from "./routes/LokasiGudangRoute.js";
import InventoryRoute from "./routes/InventoryRoute.js";

// Use routes with /api prefix
app.use("/api", AuthRoute);
app.use("/api", ManagerRoute);
app.use("/api", TransactionRoute);
app.use("/api", LokasiGudangRoute);
app.use("/api", InventoryRoute);

// Test endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "🚀 Server is running!",
    endpoints: {
      inventory: "/api/inventory",
      users: "/api/users",
      transactions: "/api/transactions",
      warehouses: "/api/warehouses"
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: "❌ Server error occurred" 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Inventory API: http://localhost:${PORT}/api/inventory`);
});