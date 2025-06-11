// jamuku-backend/middleware/authMiddleware.js

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'rahasia123';

export const verifyToken = (req, res, next) => {
    console.log("VerifyToken: Function called.");
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log("VerifyToken: No token or invalid format.");
        return res.status(403).json({ message: 'Token tidak ditemukan atau format tidak valid.' });
    }

    const token = authHeader.split(' ')[1];
    console.log("VerifyToken: Token received:", token.substring(0, 30) + "..."); // Log sebagian token

    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            console.error("VerifyToken: Token verification failed:", err.message);
            return res.status(401).json({ message: 'Token tidak valid atau sudah kadaluarsa.' });
        }

        // --- Ini adalah bagian penting yang perlu Anda perhatikan ---
        // Pastikan req.user mendapatkan payload yang benar.
        // Jika payload token Anda memiliki 'userRole', pastikan itu yang digunakan.
        req.user = decoded; // Ini akan mengisi req.user dengan seluruh payload token
        // Contoh payload: { userId: 25, userName: 'manager', userRole: 'MANAGER', ... }
        // Maka: req.user.userId, req.user.userName, req.user.userRole akan tersedia.

        // Anda sudah memiliki ini dan itu membantu debugging, tapi pastikan konsisten
        // dengan apa yang digunakan oleh middleware lain.
        // Jika middleware lain menggunakan req.user.role, maka pastikan decoded.role ada
        // atau kita mapping decoded.userRole ke req.user.role
        // Untuk konsistensi dengan roleMiddleware.js (yang mungkin mencari req.user.role):
        req.user.role = decoded.userRole; // Pastikan req.user.role juga terisi
        req.userIdFromToken = decoded.userId; // Tetap pertahankan untuk debugging Anda
        req.userRoleFromToken = decoded.userRole; // Tetap pertahankan untuk debugging Anda

        console.log("VerifyToken: Token decoded successfully. Full req.user:", req.user);
        console.log("VerifyToken: Decoded userRole (from payload):", req.user.userRole);
        console.log("VerifyToken: req.userIdFromToken set to:", req.userIdFromToken);
        console.log("VerifyToken: req.userRoleFromToken set to:", req.userRoleFromToken);
        console.log("VerifyToken: req.user.role set to:", req.user.role); // Log tambahan untuk req.user.role

        next();
    });
};

export const verifyUser = (req, res, next) => {
    console.log("VerifyUser: Function called. req.user:", req.user);
    // Sekarang req.user.role seharusnya sudah terisi
    console.log("VerifyUser: Role from req.user:", req.user?.role);
    console.log("VerifyUser: req.userIdFromToken:", req.userIdFromToken);

    if (!req.user || !req.userIdFromToken || !req.userRoleFromToken || !req.user?.role) {
        return res.status(401).json({ message: "Tidak diizinkan: Data pengguna tidak ditemukan setelah verifikasi token." });
    }
    next();
};

export const verifyManager = (req, res, next) => {
    // Gunakan req.user.role untuk konsistensi dengan roleMiddleware jika ada
    const userRoleFromToken = String(req.user?.role || '').trim(); // Menggunakan req.user.role
    const expectedRole = 'MANAGER'; // <--- TULIS ULANG INI SECARA MANUAL (jangan copy-paste)

    console.log("VerifyManager: Function called.");
    console.log("VerifyManager: req.user object (full):", req.user);
    console.log("VerifyManager: userRoleFromToken (trimmed & stringified):", `'${userRoleFromToken}'`);
    console.log("VerifyManager: Expected role:", `'${expectedRole}'`);
    console.log("VerifyManager: Result of comparison (userRoleFromToken !== expectedRole):", userRoleFromToken !== expectedRole);

    // Tambahkan log detail jika perbandingan gagal, fokus pada character codes
    if (userRoleFromToken !== expectedRole) {
        console.log("VerifyManager: -- MISMATCH DETECTED --");
        console.log("VerifyManager: userRoleFromToken length:", userRoleFromToken.length);
        console.log("VerifyManager: Expected role length:", expectedRole.length);
        for (let i = 0; i < Math.max(userRoleFromToken.length, expectedRole.length); i++) {
            const charUser = userRoleFromToken.charAt(i);
            const codeUser = userRoleFromToken.charCodeAt(i);
            const charExpected = expectedRole.charAt(i);
            const codeExpected = expectedRole.charCodeAt(i);
            console.log(`Char ${i}: '${charUser}' (${codeUser}) vs '${charExpected}' (${codeExpected})`);
        }
    }

    if (userRoleFromToken !== expectedRole) {
        console.log("VerifyManager: Access denied block executed. Current role:", userRoleFromToken);
        return res.status(403).json({ message: "Akses ditolak. Hanya Manager yang bisa melakukan aksi ini." });
    }
    console.log("VerifyManager: Access granted block executed.");
    next();
};