// controllers/AuthControllers.js
import db from "../db.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'rahasia123';

export const Register = async (req, res) => {
  console.log("Register: Function called.");
  const { username, password, confPassword } = req.body;
  console.log("Register: Request body received:", { username, password, confPassword });

  if (password !== confPassword) {
    console.log("Register: Password and Confirm Password do not match.");
    return res.status(400).json({ message: "Password dan Confirm Password tidak cocok" });
  }

  const userRole = 'STAZ';
  const initialStatus = 'pending'; // Sesuai permintaan user, jika ini sudah diubah jadi 'active' di SQL, biarkan
  const plainPassword = password;

  try {
    console.log("Register: Checking if username exists:", username);
    const checkUsernameQuery = `SELECT id FROM users WHERE username = ?`;
    db.query(checkUsernameQuery, [username], (err, results) => {
      if (err) {
        console.error("Register: SQL Error in checkUsernameQuery:", err);
        return res.status(500).json({ message: "Gagal mendaftar pengguna (kesalahan database cek username)" });
      }
      if (results.length > 0) {
        console.log("Register: Username already exists.");
        return res.status(409).json({ message: "Username sudah terdaftar" });
      }

      console.log("Register: Inserting new user:", { username, userRole, initialStatus });
      const insertUserQuery = `
        INSERT INTO users (username, password, role, status)
        VALUES (?, ?, ?, ?)
      `;
      db.query(insertUserQuery, [username, plainPassword, userRole, initialStatus], (err, result) => {
        if (err) {
          console.error("Register: SQL Error in insertUserQuery:", err);
          if (err.sqlMessage) console.error("MySQL Error Message:", err.sqlMessage);
          if (err.code) console.error("MySQL Error Code:", err.code);
          return res.status(500).json({ message: "Gagal mendaftar pengguna (kesalahan database insert user)" });
        }

        console.log("Register: User registered successfully:", result.insertId);
        res.status(201).json({
          message: "Pendaftaran berhasil! Akun Anda menunggu persetujuan Manager.",
          userId: result.insertId,
          status: "pending_approval"
        });
      });
    });
  } catch (error) {
    console.error("Register: Unhandled error in try block:", error);
    res.status(500).json({ message: "Terjadi kesalahan server saat mendaftar" });
  }
};

export const Login = (req, res) => {
  console.log("Login: Function called.");
  const { username, password } = req.body;
  console.log("Login: Request body received:", { username, password });

  try {
    const findUserQuery = `SELECT id, username, password, role, status FROM users WHERE username = ?`;
    db.query(findUserQuery, [username], async (err, results) => {
      if (err) {
        console.error("Login: SQL Error in findUserQuery:", err);
        return res.status(500).json({ message: "Gagal login" });
      }

      if (results.length === 0) {
        console.log("Login: Username not found.");
        return res.status(404).json({ message: "Username tidak ditemukan" });
      }

      const user = results[0];
      console.log("Login: User data from DB:", user); // LOG: Data user dari DB

      if (user.status === 'pending') {
        console.log("Login: Account is pending approval.");
        return res.status(403).json({ message: "Akun Anda sedang menunggu persetujuan Manager." });
      }
      if (user.status === 'rejected') {
        console.log("Login: Account is rejected.");
        return res.status(403).json({ message: "Akun Anda telah ditolak. Silakan hubungi Administrator." });
      }
      if (user.status !== 'active') {
        console.log("Login: Account is not active (status:", user.status, ")");
        return res.status(403).json({ message: "Akun Anda tidak aktif. Silakan hubungi Administrator." });
      }

      const match = (password === user.password);
      if (!match) {
        console.log("Login: Incorrect password.");
        return res.status(400).json({ message: "Password salah" });
      }

      const userId = user.id;
      const userName = user.username;
      const userRole = user.role; // Ini adalah nilai role yang akan masuk ke token
      console.log("Login: Role from DB before token sign:", userRole); // LOG: Role sebelum ditandatangani

      const accessToken = jwt.sign({ userId, userName, userRole }, ACCESS_TOKEN_SECRET, {
        expiresIn: '8h'
      });
      console.log("Login: Token signed. Payload role:", jwt.decode(accessToken).userRole); // LOG: Role di dalam payload token

      res.json({ message: "Login berhasil", token: accessToken, role: userRole, userName: userName });
    });
  } catch (error) {
    console.error("Login: Unhandled error in try block:", error);
    res.status(500).json({ message: "Terjadi kesalahan server saat login" });
  }
};