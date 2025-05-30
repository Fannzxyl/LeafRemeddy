// routes/AuthRoute.js
import express from "express";
// Ini adalah baris impor yang benar dari controller AuthControllers.js!
import { Register, Login } from "../controllers/AuthControllers.js"; // PASTIKAN PATH INI BENAR

const router = express.Router();

router.post("/login", Login);

// Rute untuk pendaftaran (signup), sesuaikan dengan endpoint frontend "/register"
router.post("/register", Register);

export default router;