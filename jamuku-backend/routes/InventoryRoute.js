// routes/InventoryRoute.js
import express from "express";
import {
  getInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  getLocations
} from "../controllers/InventoryController.js";
import { verifyToken, verifyUser, verifyManager } from "../middleware/authMiddleware.js";

const router = express.Router();

// Inventory routes
router.get("/inventory", verifyToken, verifyUser, getInventory);
router.get("/inventory/:id", verifyToken, verifyUser, getInventoryById);
router.post("/inventory", verifyToken, verifyUser, createInventory);
router.put("/inventory/:id", verifyToken, verifyManager, updateInventory);
router.delete("/inventory/:id", verifyToken, verifyManager, deleteInventory);

// Locations routes (for dropdown)
router.get("/locations", verifyToken, verifyUser, getLocations);

export default router;