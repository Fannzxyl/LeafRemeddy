import React, { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import GlitterEffect from "./GlitterEffect";

export default function DashboardStaz() {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    setUsername(localStorage.getItem("username") || "");
    setRole(localStorage.getItem("role") || "");
  }, []);

  return (
    <DashboardLayout>
      <div className="relative px-4 pt-8 sm:pt-16 min-h-screen transition-all">
        <GlitterEffect className="top-0 left-0" />
        <GlitterEffect className="bottom-0 right-0" />

        {/* Info user kanan atas */}
        <div className="absolute top-4 right-6 text-sm text-right">
          <p className="text-gray-700">
            Login sebagai: <span className="text-green-600 font-semibold capitalize">{username}</span>
          </p>
          <p className="text-xs uppercase text-green-800 font-bold">{role}</p>
        </div>

        {/* Konten utama */}
        <div className="max-w-4xl ml-0 sm:ml-0">
          <h2 className="text-3xl font-bold text-green-700 mb-2">
            Dashboard Staz
          </h2>
          <p className="text-gray-700">
            Hai {username}, kamu bisa mengakses dan menambahkan data produk serta menginput transaksi ya!
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}