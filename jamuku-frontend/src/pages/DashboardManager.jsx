// src/pages/DashboardManager.jsx
import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import axios from "axios";
import { Link } from "react-router-dom";
import PieChart from "../components/charts/PieChart";
import BarChart from "../components/charts/BarChart";


// Tambahkan log ini untuk melihat apakah komponen ini berhasil dimuat
console.log("DashboardManager.jsx loaded");

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function DashboardManager() {
    // Tambahkan log ini untuk melihat apakah fungsi komponen dieksekusi
    console.log("DashboardManager component function executed");

    const [managerUsername, setManagerUsername] = useState("");
    const [inventorySummary, setInventorySummary] = useState([]);
    const [transactionSummary, setTransactionSummary] = useState([]);
    const [loadingCharts, setLoadingCharts] = useState(true);
    const [errorCharts, setErrorCharts] = useState(null);
    const [totalProducts, setTotalProducts] = useState(0);
    const [lowStockItems, setLowStockItems] = useState(0);
    const [pendingTransactions, setPendingTransactions] = useState(0);
    const [pendingUsers, setPendingUsers] = useState(0);
    const [dateRange, setDateRange] = useState('7');
    // --- FITUR BARU: State untuk Top Selling Products ---
    const [topSellingProducts, setTopSellingProducts] = useState([]);
    // --- AKHIR FITUR BARU ---

    const fetchChartData = useCallback(async () => {
        console.log("fetchChartData called"); // Log saat fungsi dipanggil
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setErrorCharts("Token tidak ditemukan. Silakan login ulang.");
                setLoadingCharts(false);
                return;
            }

            setLoadingCharts(true);
            setErrorCharts(null);

            // Fetch Inventory Summary
            const inventoryRes = await axios.get(`${API_BASE}/api/dashboard/inventory-summary-category`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInventorySummary(inventoryRes.data);
            console.log("Inventory Summary fetched:", inventoryRes.data);

            // Fetch Daily Transaction Summary
            const transactionRes = await axios.get(`${API_BASE}/api/dashboard/daily-transaction-summary?days=${dateRange}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Frontend Raw Transaction Response Data:", transactionRes.data);

            const formattedTransactionData = transactionRes.data.map(item => ({
                ...item,
                date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
            }));
            setTransactionSummary(formattedTransactionData);
            console.log("Frontend Formatted Transaction Data for Bar Chart:", formattedTransactionData);


            // Fetch Metrics
            const metricsRes = await axios.get(`${API_BASE}/api/dashboard/metrics`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setTotalProducts(metricsRes.data.totalProducts || 0);
            setLowStockItems(metricsRes.data.lowStockItems || 0);
            setPendingTransactions(metricsRes.data.pendingTransactions || 0);
            setPendingUsers(metricsRes.data.pendingUsers || 0);
            console.log("Metrics fetched:", metricsRes.data);

            // --- FITUR BARU: Fetch Top Selling Products ---
            const topSellingRes = await axios.get(`${API_BASE}/api/dashboard/top-selling-products`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTopSellingProducts(topSellingRes.data);
            console.log("Top Selling Products fetched:", topSellingRes.data);
            // --- AKHIR FITUR BARU ---

            setLoadingCharts(false);
        } catch (err) {
            console.error("Error fetching chart data:", err);
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
            if (errorMessage.includes("Table") && errorMessage.includes("doesn't exist")) {
                setErrorCharts("Error Database: Pastikan semua tabel (inventories, transactions, users) sudah ada di database Anda.");
            } else {
                // Log error status untuk debugging lebih lanjut
                console.error("Full AxiosError Response:", err.response);
                setErrorCharts(errorMessage || "Gagal memuat data dashboard. Pastikan server backend berjalan.");
            }
            setLoadingCharts(false);
        }
    }, [dateRange]);

    // Initial load
    useEffect(() => {
        console.log("useEffect for initial load executed");
        const username = localStorage.getItem("username");
        if (username) {
            setManagerUsername(username);
        }

        fetchChartData();
    }, [fetchChartData]);

    // Auto-refresh setiap 5 menit
    useEffect(() => {
        console.log("useEffect for auto-refresh registered");
        const interval = setInterval(() => {
            fetchChartData();
        }, 300000); // 5 minutes

        return () => clearInterval(interval);
    }, [fetchChartData]);

    const handleRefresh = () => {
        console.log("Refresh button clicked");
        fetchChartData();
    };

    return (
        <DashboardLayout>
            {/* ... (Konten HTML/JSX lainnya tetap sama) ... */}
            <div className="p-6">
                {/* Header Dashboard */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                            Dashboard <span className="text-green-600">{managerUsername}</span>
                        </h1>
                        <p className="text-lg text-gray-700">
                            Selamat datang! Anda memiliki akses penuh terhadap manajemen produk, transaksi, dan pengguna.
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        {/* Date Range Selector */}
                        <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium text-gray-700">Periode:</label>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="7">7 Hari Terakhir</option>
                                <option value="30">30 Hari Terakhir</option>
                                <option value="90">3 Bulan Terakhir</option>
                            </select>
                        </div>
                        {/* Refresh Button */}
                        <button
                            onClick={handleRefresh}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                            disabled={loadingCharts}
                        >
                            <svg className={`w-4 h-4 ${loadingCharts ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>{loadingCharts ? 'Loading...' : 'Refresh'}</span>
                        </button>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Produk</p>
                                <p className="text-3xl font-bold text-blue-600">{totalProducts}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Stok Menipis</p>
                                <p className="text-3xl font-bold text-red-600">{lowStockItems}</p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-full">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.764 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Transaksi Pending</p>
                                <p className="text-3xl font-bold text-yellow-600">{pendingTransactions}</p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-full">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">User Pending</p>
                                <p className="text-3xl font-bold text-purple-600">{pendingUsers}</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-full">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading / Error States for Charts */}
                {loadingCharts ? (
                    <div className="text-center py-12 text-lg text-gray-600">
                        <svg className="animate-spin h-12 w-12 text-green-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p>Memuat data dashboard...</p>
                    </div>
                ) : errorCharts ? (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6 shadow-md">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <strong className="font-bold">Gagal Memuat Dashboard!</strong>
                                <p className="mt-1">{errorCharts}</p>
                                <p className="mt-2 text-sm">Pastikan backend server berjalan di http://localhost:5000</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Chart Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                            {/* Pie Chart: Total Stok per Kategori */}
                            <div className="bg-white p-6 rounded-xl shadow-lg">
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Distribusi Stok per Kategori</h3>
                                <div className="h-80 flex items-center justify-center">
                                    {inventorySummary.length > 0 ? (
                                        <PieChart data={inventorySummary} title="Distribusi Stok per Kategori" />
                                    ) : (
                                        <div className="text-center">
                                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            <p className="text-gray-500">Tidak ada data stok untuk ditampilkan.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bar Chart: Transaksi Harian */}
                            <div className="bg-white p-6 rounded-xl shadow-lg">
                                <h3 className="text-xl font-bold text-gray-800 mb-4">
                                    Transaksi Masuk/Keluar ({dateRange} Hari Terakhir)
                                </h3>
                                <div className="h-80 flex items-center justify-center">
                                    {transactionSummary.length > 0 ? (
                                        <BarChart
                                            data={transactionSummary}
                                            title={`Total Transaksi Masuk/Keluar (${dateRange} Hari Terakhir)`}
                                        />
                                    ) : (
                                        <div className="text-center">
                                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            <p className="text-gray-500">
                                                Tidak ada data transaksi dalam {dateRange} hari terakhir.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* --- FITUR BARU: Top Selling Products Section --- */}
                        <div className="bg-white p-6 rounded-xl shadow-lg mb-10">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Top 3 Barang Terlaris</h3>
                            {topSellingProducts.length > 0 ? (
                                <ul className="divide-y divide-gray-200">
                                    {topSellingProducts.map((product, index) => (
                                        <li key={index} className="py-3 flex items-center justify-between">
                                            <div className="flex items-center">
                                                <span className="text-lg font-semibold mr-3 text-green-600">{index + 1}.</span>
                                                {/* PERBAIKAN DI SINI: Menggunakan product.namaProduk sesuai dengan response backend */}
                                                <p className="text-lg text-gray-800">{product.namaProduk}</p>
                                            </div>
                                            <p className="text-md font-medium text-gray-700">Terjual: {product.total_quantity_sold} unit</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-6 text-gray-500">
                                    <p>Belum ada data barang terlaris.</p>
                                    <p className="text-sm">Pastikan ada transaksi 'keluar' yang sudah di-approve.</p>
                                </div>
                            )}
                        </div>
                        {/* --- AKHIR FITUR BARU --- */}

                        {/* Navigation Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Link
                                to="/inventory"
                                className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                            >
                                <div className="flex items-center mb-3">
                                    <div className="p-2 bg-blue-500 rounded-lg mr-3 group-hover:bg-blue-600 transition-colors duration-300">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                    <h3 className="font-bold text-blue-800 text-xl">Lihat Inventaris</h3>
                                </div>
                                <p className="text-blue-700">Kelola daftar produk dan stok gudang.</p>
                            </Link>

                            <Link
                                to="/transactions"
                                className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                            >
                                <div className="flex items-center mb-3">
                                    <div className="p-2 bg-green-500 rounded-lg mr-3 group-hover:bg-green-600 transition-colors duration-300">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                    </div>
                                    <h3 className="font-bold text-green-800 text-xl">Lihat Transaksi</h3>
                                </div>
                                <p className="text-green-700">Tinjau dan kelola semua riwayat transaksi.</p>
                                {pendingTransactions > 0 && (
                                    <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        {pendingTransactions} pending
                                    </div>
                                )}
                            </Link>

                            <Link
                                to="/users"
                                className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500 rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                            >
                                <div className="flex items-center mb-3">
                                    <div className="p-2 bg-purple-500 rounded-lg mr-3 group-hover:bg-purple-600 transition-colors duration-300">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-bold text-purple-800 text-xl">Manajemen Pengguna</h3>
                                </div>
                                <p className="text-purple-700">Setujui pengguna baru & kelola akses sistem.</p>
                                {pendingUsers > 0 && (
                                    <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        {pendingUsers} pending
                                    </div>
                                )}
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}