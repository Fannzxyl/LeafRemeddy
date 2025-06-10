// db.js
// Import modul mysql2/promise untuk dukungan Promise dan async/await
import mysql from 'mysql2/promise'; 
import dotenv from 'dotenv'; // Untuk membaca variabel lingkungan dari .env

dotenv.config(); // Muat variabel lingkungan

// Buat pool koneksi database
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost', // Gunakan variabel lingkungan atau default
    user: process.env.DB_USER || 'root',      // Ganti dengan username database Anda
    password: process.env.DB_PASSWORD || '',  // Ganti dengan password database Anda
    database: process.env.DB_NAME || 'jamuku_db', // Ganti dengan nama database Anda
    waitForConnections: true, // Menentukan apakah pool akan menunggu koneksi tersedia saat semua sedang digunakan
    connectionLimit: 10,      // Batas jumlah koneksi dalam pool
    queueLimit: 0             // Batas jumlah permintaan yang di-queue
});

// Penting: Ekspor instance pool yang sudah berbasis Promise
// Ini memungkinkan Anda menggunakan await pool.query() atau await connection.execute()
// di controller Anda.
const db = pool; // Karena 'mysql2/promise' pool itu sendiri sudah promise-based

export default db;