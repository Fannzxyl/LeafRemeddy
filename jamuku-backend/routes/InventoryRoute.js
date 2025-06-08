// routes/InventoryRoute.js
import express from "express";
import {
  getInventory,       // Ini yang dipanggil oleh AddTransaction untuk daftar produk
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  getLocations        // Ini untuk lokasi gudang
} from "../controllers/InventoryController.js"; // Pastikan InventoryController.js ada dan meng-export ini
import { verifyToken, verifyUser, verifyManager } from "../middleware/authMiddleware.js";

const router = express.Router();

// Inventory routes
router.get("/inventory", verifyToken, verifyUser, getInventory); // Endpoint untuk mengambil semua inventaris
router.get("/inventory/:id", verifyToken, verifyUser, getInventoryById);
router.post("/inventory", verifyToken, verifyUser, createInventory);
router.put("/inventory/:id", verifyToken, verifyManager, updateInventory);
router.delete("/inventory/:id", verifyToken, verifyManager, deleteInventory);

// Locations routes (for dropdown)
router.get("/locations", verifyToken, verifyUser, getLocations); // Endpoint untuk mengambil semua lokasi

export default router;