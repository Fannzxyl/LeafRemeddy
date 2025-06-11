// src/pages/DashboardStaz.jsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom"; 
import DashboardLayout from "../layouts/DashboardLayout";
import GlitterEffect from "../components/GlitterEffect"; 

export default function DashboardStaz() {
  const username = useMemo(() => localStorage.getItem("username") || "Pengguna", []);
  const role = useMemo(() => localStorage.getItem("role") || "Pengguna Aplikasi", []);

  return (
    <DashboardLayout>
      <div className="relative px-4 pt-8 sm:pt-16 pb-8 min-h-screen bg-gray-50 overflow-hidden">
    
        <GlitterEffect className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-64 sm:h-64 opacity-70" />
        <GlitterEffect className="absolute bottom-1/4 right-1/4 transform translate-x-1/2 translate-y-1/2 w-48 h-48 sm:w-64 sm:h-64 opacity-70" />

        {/* Info user kanan atas */}
        <div 
          className="absolute top-4 right-6 text-sm text-right opacity-0 animate-fadeIn" 
          style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
        >
          <p className="text-gray-700">
            Login sebagai: <span className="text-green-600 font-semibold capitalize">{username}</span>
          </p>
          <p className="text-xs uppercase text-green-800 font-bold">{role}</p>
        </div>

        {/* Konten utama */}
        <div 
          className="max-w-4xl mx-auto px-4 relative z-10 text-center opacity-0 animate-slideInUp" 
          style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
        >
          <h2 className="text-4xl font-extrabold text-green-700 mb-4 tracking-tight leading-tight">
            Selamat Datang di Dashboard <br className="sm:hidden"/> <span className="text-green-500">{username}!</span>
          </h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
            Sebagai seorang Staff, Anda memiliki akses untuk melihat dan menambahkan data produk, serta mengelola transaksi secara efisien.
          </p>

          {/* Bagian pengantar fungsionalitas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            {/* Kartu Fungsionalitas Produk */}
            <div 
              className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500 opacity-0 animate-slideInUp" 
              style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}
            >
              <h3 className="text-xl font-semibold text-blue-700 mb-3 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                Manajemen Produk
              </h3>
              <p className="text-gray-600">
                Lihat daftar produk, perbarui stok, dan tambahkan produk baru ke gudang.
              </p>
              <Link 
                to="/inventory" 
                className="mt-4 inline-flex items-center text-green-600 hover:text-green-800 font-medium transition-colors"
              >
                Go to Inventory
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>

            {/* Kartu Fungsionalitas Transaksi */}
            <div 
              className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500 opacity-0 animate-slideInUp" 
              style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}
            >
              <h3 className="text-xl font-semibold text-green-700 mb-3 flex items-center">
                <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                Input & Kelola Transaksi
              </h3>
              <p className="text-gray-600">
                Catat transaksi masuk dan keluar, serta tinjau riwayat transaksi.
              </p>
              <Link 
                to="/transactions" 
                className="mt-4 inline-flex items-center text-green-600 hover:text-green-800 font-medium transition-colors"
              >
                Go to Transactions
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}