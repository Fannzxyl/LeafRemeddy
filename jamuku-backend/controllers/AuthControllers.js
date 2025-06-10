// controllers/AuthControllers.js
import db from "../db.js"; // db sekarang adalah instance pool yang berbasis Promise
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'rahasia123';

export const Register = async (req, res) => { // Mengubah ke async
    console.log("Register: Function called.");
    const { username, password, confPassword } = req.body;
    console.log("Register: Request body received:", { username, password, confPassword });

    if (password !== confPassword) {
        console.log("Register: Password and Confirm Password do not match.");
        return res.status(400).json({ message: "Password dan Confirm Password tidak cocok" });
    }

    const userRole = 'STAZ';
    const initialStatus = 'pending';
    const plainPassword = password; // HATI-HATI: Seharusnya password di-hash (misal bcrypt) sebelum disimpan

    try {
        console.log("Register: Checking if username exists:", username);
        const checkUsernameQuery = `SELECT id FROM users WHERE username = ?`;
        // Menggunakan await db.query()
        const [results] = await db.query(checkUsernameQuery, [username]); // [0] untuk hasil query

        if (results.length > 0) {
            console.log("Register: Username already exists.");
            return res.status(409).json({ message: "Username sudah terdaftar" });
        }

        console.log("Register: Inserting new user:", { username, userRole, initialStatus });
        const insertUserQuery = `
            INSERT INTO users (username, password, role, status)
            VALUES (?, ?, ?, ?)
        `;
        // Menggunakan await db.query()
        const [result] = await db.query(insertUserQuery, [username, plainPassword, userRole, initialStatus]); // [0] untuk hasil query

        console.log("Register: User registered successfully:", result.insertId);
        res.status(201).json({
            message: "Pendaftaran berhasil! Akun Anda menunggu persetujuan Manager.",
            userId: result.insertId,
            status: "pending_approval"
        });
    } catch (error) {
        console.error("Register: Unhandled error in try block:", error);
        res.status(500).json({ message: "Terjadi kesalahan server saat mendaftar", error: error.message }); // Tambahkan error.message untuk debug
    }
};

export const Login = async (req, res) => { // Mengubah ke async
    console.log("Login: Function called.");
    const { username, password } = req.body;
    console.log("Login: Request body received:", { username, password });

    try {
        const findUserQuery = `SELECT id, username, password, role, status FROM users WHERE username = ?`;
        // Menggunakan await db.query()
        const [results] = await db.query(findUserQuery, [username]); // [0] untuk hasil query

        if (results.length === 0) {
            console.log("Login: Username not found.");
            return res.status(404).json({ message: "Username tidak ditemukan" });
        }

        const user = results[0];
        console.log("Login: User data from DB:", user); 

        if (user.status === 'pending') {
            console.log("Login: Account is pending approval.");
            return res.status(403).json({ message: "Akun Anda sedang menunggu persetujuan Manager." });
        }
        if (user.status === 'rejected') {
            console.log("Login: Account is rejected.");
            return res.status(403).json({ message: "Akun Anda telah ditolak. Silakan hubungi Administrator." });
        }
        if (user.status !== 'active') { // Pastikan status ini 'active'
            console.log("Login: Account is not active (status:", user.status, ")");
            return res.status(403).json({ message: "Akun Anda tidak aktif. Silakan hubungi MANAGER." });
        }

        // HATI-HATI: Anda menyimpan plain password di DB dan membandingkan langsung.
        // Sangat disarankan untuk menggunakan library hashing password (misal bcrypt)
        // const match = await bcrypt.compare(password, user.password);
        const match = (password === user.password); // Perbandingan password plain-text
        if (!match) {
            console.log("Login: Incorrect password.");
            return res.status(400).json({ message: "Password salah" });
        }

        const userId = user.id;
        const userName = user.username;
        const userRole = user.role;
        console.log("Login: Role from DB before token sign:", userRole);

        const accessToken = jwt.sign({ userId, userName, userRole }, ACCESS_TOKEN_SECRET, {
            expiresIn: '8h'
        });
        console.log("Login: Token signed. Payload role:", jwt.decode(accessToken).userRole);

        res.json({ message: "Login berhasil", token: accessToken, role: userRole, userName: userName });
    } catch (error) {
        console.error("Login: Unhandled error in try block:", error);
        res.status(500).json({ message: "Terjadi kesalahan server saat login", error: error.message }); // Tambahkan error.message untuk debug
    }
};
