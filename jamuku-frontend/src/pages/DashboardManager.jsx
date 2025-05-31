// src/pages/DashboardManager.jsx
import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import axios from "axios";
import { Link } from "react-router-dom";
import PieChart from "../components/charts/PieChart";
import BarChart from "../components/charts/BarChart";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function DashboardManager() {
  const [managerUsername, setManagerUsername] = useState("");
  const [inventorySummary, setInventorySummary] = useState([]);
  const [transactionSummary, setTransactionSummary] = useState([]);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [errorCharts, setErrorCharts] = useState(null);

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (username) {
      setManagerUsername(username);
    }

    const fetchChartData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setErrorCharts("Token tidak ditemukan. Silakan login ulang.");
          setLoadingCharts(false);
          return;
        }

        // Fetch Inventory Summary
        // PERUBAHAN URL: Sekarang panggil /api/dashboard/inventory-summary-category
        const inventoryRes = await axios.get(`${API_BASE}/api/dashboard/inventory-summary-category`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInventorySummary(inventoryRes.data);

        // Fetch Daily Transaction Summary
        // PERUBAHAN URL: Sekarang panggil /api/dashboard/daily-transaction-summary
        const transactionRes = await axios.get(`${API_BASE}/api/dashboard/daily-transaction-summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTransactionSummary(transactionRes.data);

        setLoadingCharts(false);
      } catch (err) {
        console.error("Error fetching chart data:", err);
        setErrorCharts(err.response?.data?.message || "Gagal memuat data chart.");
        setLoadingCharts(false);
      }
    };

    fetchChartData();
  }, []);

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header Dashboard */}
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Dashboard <span className="text-green-600">{managerUsername}</span></h1>
        <p className="text-lg text-gray-700 mb-8">
          Selamat datang! Anda memiliki akses penuh terhadap manajemen produk, transaksi, dan pengguna.
        </p>

        {/* Loading / Error States for Charts */}
        {loadingCharts ? (
          <div className="text-center py-12 text-lg text-gray-600">
            <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Memuat data chart...
          </div>
        ) : errorCharts ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 shadow-md">
            <strong className="font-bold">Error Memuat Chart!</strong>
            <span className="block sm:inline ml-2">{errorCharts}</span>
          </div>
        ) : (
          <>
            {/* Chart Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              {/* Pie Chart: Total Stok per Kategori */}
              <div className="bg-white p-6 rounded-xl shadow-lg h-96 flex flex-col items-center justify-center">
                {inventorySummary.length > 0 ? (
                  <PieChart data={inventorySummary} title="Distribusi Stok per Kategori" />
                ) : (
                  <p className="text-gray-500 text-center">Tidak ada data stok aktif untuk ditampilkan.</p>
                )}
              </div>

              {/* Bar Chart: Transaksi Harian */}
              <div className="bg-white p-6 rounded-xl shadow-lg h-96 flex flex-col items-center justify-center">
                {transactionSummary.length > 0 ? (
                  <BarChart data={transactionSummary} title="Total Transaksi Masuk/Keluar (7 Hari Terakhir)" />
                ) : (
                  <p className="text-gray-500 text-center">Tidak ada data transaksi disetujui dalam 7 hari terakhir.</p>
                )}
              </div>
            </div>

            {/* Quick Links / Overview Cards (Optional) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link to="/inventory" className="bg-blue-100 border-l-4 border-blue-500 rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
                    <h3 className="font-bold text-blue-800 text-lg mb-2">Lihat Inventaris</h3>
                    <p className="text-blue-700 text-sm">Kelola daftar produk dan stok.</p>
                </Link>
                <Link to="/transactions" className="bg-green-100 border-l-4 border-green-500 rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
                    <h3 className="font-bold text-green-800 text-lg mb-2">Lihat Transaksi</h3>
                    <p className="text-green-700 text-sm">Tinjau semua riwayat transaksi.</p>
                </Link>
                <Link to="/users" className="bg-purple-100 border-l-4 border-purple-500 rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
                    <h3 className="font-bold text-purple-800 text-lg mb-2">Manajemen Pengguna</h3>
                    <p className="text-purple-700 text-sm">Setujui pengguna baru & kelola akses.</p>
                </Link>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}