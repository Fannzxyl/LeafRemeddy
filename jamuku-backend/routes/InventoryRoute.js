import express from "express";
import {
  getInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  getLocations
} from "../controllers/InventoryController.js";

const router = express.Router();

// Inventory routes
router.get("/inventory", getInventory);
router.get("/inventory/:id", getInventoryById);
router.post("/inventory", createInventory);
router.put("/inventory/:id", updateInventory);
router.delete("/inventory/:id", deleteInventory);

// Locations routes (untuk dropdown)
router.get("/locations", getLocations);

export default router;