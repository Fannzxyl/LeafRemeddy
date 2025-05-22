import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from "../controllers/ProductController.js";
import { body } from "express-validator";

const router = express.Router();

// Public
router.get("/products", getProducts);
router.get("/products/:id", getProductById);

// Public - create dan update tetap bisa validasi input
router.post(
  "/products",
  [
    body("name").notEmpty().withMessage("Nama produk wajib diisi"),
    body("price").isFloat({ min: 0 }).withMessage("Harga tidak valid"),
  ],
  createProduct
);

router.put("/products/:id", updateProduct);

// 🔥 Hapus produk tanpa JWT, hanya dengan username & password
router.delete("/products/:id", deleteProduct);

export default router;
