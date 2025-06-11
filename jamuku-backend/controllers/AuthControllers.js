// controllers/AuthControllers.js
import db from "../db.js"; // Mengimpor koneksi database pool yang berbasis Promise.
import jwt from "jsonwebtoken"; // Mengimpor library untuk JSON Web Tokens.
import dotenv from "dotenv"; // Mengimpor library untuk memuat variabel lingkungan dari .env.
// Pastikan bcrypt juga diimpor di sini jika sudah diinstal
// import bcrypt from 'bcrypt'; // Ini perlu diinstal: npm install bcrypt

// Memuat variabel lingkungan dari file .env.
dotenv.config();

// Mendefinisikan kunci rahasia untuk JWT, diambil dari variabel lingkungan.
// Fallback 'rahasia123' hanya untuk development, sebaiknya gunakan nilai yang kuat di produksi.
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'rahasia123';

// Fungsi untuk proses pendaftaran user baru.
export const Register = async (req, res) => {
    // console.log("Register: Function called."); // Komentar debug ini bisa dihapus jika tidak diperlukan
    // Menerima data username, password, dan konfirmasi password dari body request.
    const { username, password, confPassword } = req.body;
    // console.log("Register: Request body received:", { username, password, confPassword }); // Komentar debug ini bisa dihapus jika tidak diperlukan

    // Memeriksa apakah password dan konfirmasi password cocok.
    if (password !== confPassword) {
        // console.log("Register: Password and Confirm Password do not match."); // Komentar debug ini bisa dihapus jika tidak diperlukan
        return res.status(400).json({ message: "Password dan Confirm Password tidak cocok" });
    }

    // Menetapkan role default untuk user baru sebagai 'STAZ' dan status 'pending'.
    const userRole = 'STAZ';
    const initialStatus = 'pending';

    // PERINGATAN KEAMANAN KRITIS:
    // MENYIMPAN PASSWORD DALAM PLAIN-TEXT ADALAH SANGAT TIDAK AMAN!
    // GUNAKAN LIBRARY HASHING PASSWORD SEPERTI BCRYPT SEBELUM MENYIMPANNYA KE DATABASE.
    // Contoh penggunaan bcrypt (jika sudah diinstal dan diimpor):
    // const salt = await bcrypt.genSalt();
    // const hashedPassword = await bcrypt.hash(password, salt);
    const plainPassword = password; // Untuk sementara, ini menggunakan plain password

    try {
        // Memeriksa apakah username sudah ada di database.
        // console.log("Register: Checking if username exists:", username); // Komentar debug ini bisa dihapus jika tidak diperlukan
        const checkUsernameQuery = `SELECT id FROM users WHERE username = ?`;
        const [results] = await db.query(checkUsernameQuery, [username]);

        // Jika username sudah terdaftar, kembalikan error 409 Conflict.
        if (results.length > 0) {
            // console.log("Register: Username already exists."); // Komentar debug ini bisa dihapus jika tidak diperlukan
            return res.status(409).json({ message: "Username sudah terdaftar" });
        }

        // Memasukkan user baru ke database.
        // console.log("Register: Inserting new user:", { username, userRole, initialStatus }); // Komentar debug ini bisa dihapus jika tidak diperlukan
        const insertUserQuery = `
            INSERT INTO users (username, password, role, status)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await db.query(insertUserQuery, [username, plainPassword, userRole, initialStatus]); // Gunakan hashedPassword jika bcrypt diterapkan

        // Mengirim respons sukses setelah pendaftaran.
        // console.log("Register: User registered successfully:", result.insertId); // Komentar debug ini bisa dihapus jika tidak diperlukan
        res.status(201).json({
            message: "Pendaftaran berhasil! Akun Anda menunggu persetujuan Manager.",
            userId: result.insertId,
            status: "pending_approval"
        });
    } catch (error) {
        // Menangani error server selama proses pendaftaran.
        console.error("Register: Terjadi kesalahan server saat mendaftar:", error);
        res.status(500).json({ message: "Terjadi kesalahan server saat mendaftar", error: error.message });
    }
};

// Fungsi untuk proses login user.
export const Login = async (req, res) => {
    // console.log("Login: Function called."); // Komentar debug ini bisa dihapus jika tidak diperlukan
    // Menerima data username dan password dari body request.
    const { username, password } = req.body;
    // console.log("Login: Request body received:", { username, password }); // Komentar debug ini bisa dihapus jika tidak diperlukan

    try {
        // Mencari user di database berdasarkan username.
        const findUserQuery = `SELECT id, username, password, role, status FROM users WHERE username = ?`;
        const [results] = await db.query(findUserQuery, [username]);

        // Jika username tidak ditemukan, kembalikan error 404 Not Found.
        if (results.length === 0) {
            // console.log("Login: Username not found."); // Komentar debug ini bisa dihapus jika tidak diperlukan
            return res.status(404).json({ message: "Username tidak ditemukan" });
        }

        // Mengambil data user dari hasil query.
        const user = results[0];
        // console.log("Login: User data from DB:", user); // Komentar debug ini bisa dihapus jika tidak diperlukan

        // Memeriksa status akun user.
        if (user.status === 'pending') {
            // console.log("Login: Account is pending approval."); // Komentar debug ini bisa dihapus jika tidak diperlukan
            return res.status(403).json({ message: "Akun Anda sedang menunggu persetujuan Manager." });
        }
        if (user.status === 'rejected') {
            // console.log("Login: Account is rejected."); // Komentar debug ini bisa dihapus jika tidak diperlukan
            return res.status(403).json({ message: "Akun Anda telah ditolak. Silakan hubungi Administrator." });
        }
        if (user.status !== 'active') {
            // console.log("Login: Account is not active (status:", user.status, ")"); // Komentar debug ini bisa dihapus jika tidak diperlukan
            return res.status(403).json({ message: "Akun Anda tidak aktif. Silakan hubungi MANAGER." });
        }

        // PERINGATAN KEAMANAN KRITIS:
        // PERBANDINGAN PASSWORD DALAM PLAIN-TEXT SANGAT TIDAK AMAN!
        // GUNAKAN BCRYPT.COMPARE UNTUK MEMBANDINGKAN PASSWORD YANG DI-HASH.
        // Contoh penggunaan bcrypt (jika sudah diinstal dan diimpor):
        // const match = await bcrypt.compare(password, user.password);
        const match = (password === user.password); // Untuk sementara, ini perbandingan plain-text

        // Jika password tidak cocok, kembalikan error 400 Bad Request.
        if (!match) {
            // console.log("Login: Incorrect password."); // Komentar debug ini bisa dihapus jika tidak diperlukan
            return res.status(400).json({ message: "Password salah" });
        }

        // Mendapatkan detail user untuk payload JWT.
        const userId = user.id;
        const userName = user.username;
        const userRole = user.role;
        // console.log("Login: Role from DB before token sign:", userRole); // Komentar debug ini bisa dihapus jika tidak diperlukan

        // Membuat Access Token menggunakan JWT.
        // Token akan kedaluwarsa dalam 8 jam.
        const accessToken = jwt.sign({ userId, userName, userRole }, ACCESS_TOKEN_SECRET, {
            expiresIn: '8h'
        });
        // console.log("Login: Token signed. Payload role:", jwt.decode(accessToken).userRole); // Komentar debug ini bisa dihapus jika tidak diperlukan

        // Mengirim respons sukses dengan token, role, dan username.
        res.json({ message: "Login berhasil", token: accessToken, role: userRole, userName: userName });
    } catch (error) {
        // Menangani error server selama proses login.
        console.error("Login: Terjadi kesalahan server saat login:", error);
        res.status(500).json({ message: "Terjadi kesalahan server saat login", error: error.message });
    }
};

// Fungsi untuk verifikasi token (digunakan setelah middleware verifikasi token).
export const verifyTokenEndpoint = (req, res) => {
    // console.log("VerifyTokenEndpoint: Function called."); // Komentar debug ini bisa dihapus jika tidak diperlukan
    // console.log("VerifyTokenEndpoint: req.user:", req.user); // Komentar debug ini bisa dihapus jika tidak diperlukan
    
    // Ini berfungsi untuk mengonfirmasi bahwa token yang diberikan klien valid dan
    // untuk mengembalikan data user yang terkandung dalam token.
    // Jika kode mencapai fungsi ini, berarti middleware 'verifyToken' sebelumnya
    // sudah berhasil memvalidasi token dan menyisipkan data user ke req.user.
    try {
        res.json({
            success: true,
            message: "Token valid",
            user: {
                id: req.user.userId,
                username: req.user.userName,
                role: req.user.userRole
            },
            role: req.user.userRole // Frontend mengharapkan field 'role'
        });
    } catch (error) {
        // Menangani error yang mungkin terjadi selama pengiriman respons,
        // meskipun sebagian besar error token sudah ditangani oleh middleware.
        console.error("VerifyTokenEndpoint: Error saat memproses verifikasi token:", error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat verifikasi token"
        });
    }
};