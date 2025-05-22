import express from "express";
import {
  getAllWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from "../controllers/WarehouseController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Semua endpoint butuh token
router.get("/warehouses", verifyToken, getAllWarehouses);
router.post("/warehouses", verifyToken, authorizeRoles("MANAGER"), createWarehouse);
router.put("/warehouses/:id", verifyToken, authorizeRoles("MANAGER"), updateWarehouse);
router.delete("/warehouses/:id", verifyToken, authorizeRoles("MANAGER"), deleteWarehouse);

export default router;
