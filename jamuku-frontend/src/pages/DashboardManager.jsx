import React from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import GlitterEffect from "./GlitterEffect";

export default function DashboardManager() {
  return (
    <DashboardLayout>
      <div className="relative px-4 pt-8 sm:pt-16 min-h-screen transition-all">
        {/* Efek glitter */}
        <GlitterEffect className="top-0 left-0" />
        <GlitterEffect className="bottom-0 right-0" />

        {/* Konten utama */}
        <div className="max-w-4xl ml-0 sm:ml-0">
          <h2 className="text-3xl font-bold text-green-700 mb-2">
            Dashboard Manager
          </h2>
          <p className="text-gray-700">
            Selamat datang! Anda memiliki akses penuh terhadap manajemen produk, transaksi, dan pengguna.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}