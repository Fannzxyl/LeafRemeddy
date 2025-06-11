// routes/AuthRoute.js
import express from "express";
// Ini adalah baris impor yang benar dari controller AuthControllers.js!
import { Register, Login, verifyTokenEndpoint } from "../controllers/AuthControllers.js"; // PASTIKAN PATH INI BENAR
import { verifyToken } from "../middleware/authMiddleware.js"; // Import middleware untuk verify token

const router = express.Router();

router.post("/login", Login);

// Rute untuk pendaftaran (signup), sesuaikan dengan endpoint frontend "/register"
router.post("/register", Register);

// TAMBAHAN: Rute untuk verify token
router.post("/auth/verify-token", verifyToken, verifyTokenEndpoint);

export default router;