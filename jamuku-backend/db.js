// db.js
import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

// Menggunakan createPool() untuk membuat connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'leaff-remeddy',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Menguji koneksi pool saat aplikasi dimulai
pool.getConnection((err, connection) => {
  if (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection was closed.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('Database has too many connections.');
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused.');
    }
    console.error('❌ Gagal terhubung ke database MySQL (Pool Error):', err.message);
    process.exit(1);
  } else {
    console.log('✅ Terkoneksi ke database MySQL (leaff-remeddy) melalui Connection Pool');
    if (connection) connection.release();
  }
});

export default pool;