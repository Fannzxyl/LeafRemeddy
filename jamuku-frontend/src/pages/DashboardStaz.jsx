import React from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import GlitterEffect from "./GlitterEffect";

export default function DashboardStaz() {
  return (
    <DashboardLayout>
      <div className="relative px-4 pt-8 sm:pt-16 min-h-screen transition-all">
        {/* Efek glitter */}
        <GlitterEffect className="top-0 left-0" />
        <GlitterEffect className="bottom-0 right-0" />

        {/* Konten utama */}
        <div className="max-w-4xl ml-0 sm:ml-0">
          <h2 className="text-3xl font-bold text-green-700 mb-2">
            Dashboard Staz
          </h2>
          <p className="text-gray-700">
            Hai Staz! Kamu bisa mengakses dan menambahkan data produk serta menginput transaksi.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}