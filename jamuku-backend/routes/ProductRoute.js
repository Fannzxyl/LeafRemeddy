import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/ProductController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { body } from "express-validator";

const router = express.Router();

// Public
router.get("/products", getProducts);
router.get("/products/:id", getProductById);

// Private - butuh token
router.post(
  "/products",
  verifyToken,
  [
    body("name").notEmpty().withMessage("Nama produk wajib diisi"),
    body("price").isFloat({ min: 0 }).withMessage("Harga tidak valid"),
  ],
  createProduct
);

router.put("/products/:id", verifyToken, updateProduct);
router.delete("/products/:id", verifyToken, deleteProduct);

export default router;
