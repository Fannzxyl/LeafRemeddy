import express from "express";
import db from "../db.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Login
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.query(
    "SELECT * FROM users WHERE username = ? AND password = ? LIMIT 1",
    [username, password],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      if (results.length === 0)
        return res.status(401).json({ message: "Username atau password salah" });

      const user = results[0];
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.json({
        message: "Login berhasil",
        token,
        role: user.role,
        username: user.username,
      });
    }
  );
});

// Signup
router.post("/signup", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Username dan password wajib diisi" });

  db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    if (results.length > 0)
      return res.status(400).json({ message: "Username sudah dipakai" });

    db.query(
      "INSERT INTO users (username, password, role) VALUES (?, ?, 'STAZ')",
      [username, password],
      (err2) => {
        if (err2) return res.status(500).json({ message: err2.message });
        res.status(201).json({ message: "User berhasil didaftarkan" });
      }
    );
  });
});

export default router;