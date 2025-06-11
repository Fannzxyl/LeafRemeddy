// src/pages/DashboardManager.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import axios from "axios";
import { Link } from "react-router-dom";
import PieChart from "../components/charts/PieChart";
import BarChart from "../components/charts/BarChart";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

// Loading skeleton component
const MetricCardSkeleton = () => (
    <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-gray-200 animate-pulse">
        <div className="flex items-center justify-between">
            <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
            </div>
        </div>
    </div>
);

// Chart skeleton component
const ChartSkeleton = () => (
    <div className="bg-white p-6 rounded-xl shadow-lg animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-80 bg-gray-100 rounded flex items-center justify-center">
            <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
        </div>
    </div>
);

export default function DashboardManager() {
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
    const [topSellingProducts, setTopSellingProducts] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Memoized API token
    const token = useMemo(() => localStorage.getItem("token"), []);

    const fetchChartData = useCallback(async (isRefresh = false) => {
        try {
            if (!token) {
                setErrorCharts("Token tidak ditemukan. Silakan login ulang.");
                setLoadingCharts(false);
                return;
            }

            if (isRefresh) {
                setIsRefreshing(true);
            } else {
                setLoadingCharts(true);
            }
            setErrorCharts(null);

            // Parallel API calls untuk performa yang lebih baik
            const [inventoryRes, transactionRes, metricsRes, topSellingRes] = await Promise.all([
                axios.get(`${API_BASE}/api/dashboard/inventory-summary-category`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_BASE}/api/dashboard/daily-transaction-summary?days=${dateRange}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_BASE}/api/dashboard/metrics`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_BASE}/api/dashboard/top-selling-products`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            // Update state dengan smooth transition
            setInventorySummary(inventoryRes.data);
            
            const formattedTransactionData = transactionRes.data.map(item => ({
                ...item,
                date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
            }));
            setTransactionSummary(formattedTransactionData);

            setTotalProducts(metricsRes.data.totalProducts || 0);
            setLowStockItems(metricsRes.data.lowStockItems || 0);
            setPendingTransactions(metricsRes.data.pendingTransactions || 0);
            setPendingUsers(metricsRes.data.pendingUsers || 0);
            setTopSellingProducts(topSellingRes.data);

        } catch (err) {
            console.error("Error fetching chart data:", err);
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
            if (errorMessage.includes("Table") && errorMessage.includes("doesn't exist")) {
                setErrorCharts("Error Database: Pastikan semua tabel (inventories, transactions, users) sudah ada di database Anda.");
            } else {
                setErrorCharts(errorMessage || "Gagal memuat data dashboard. Pastikan server backend berjalan.");
            }
        } finally {
            setLoadingCharts(false);
            setIsRefreshing(false);
        }
    }, [dateRange, token]);

    // Initial load dengan smooth fade-in
    useEffect(() => {
        const username = localStorage.getItem("username");
        if (username) {
            setManagerUsername(username);
        }

        // Delay sedikit untuk smooth loading experience
        const timer = setTimeout(() => {
            fetchChartData();
        }, 300);

        return () => clearTimeout(timer);
    }, [fetchChartData]);

    // Auto-refresh dengan debounce
    useEffect(() => {
        const interval = setInterval(() => {
            fetchChartData(true); // Silent refresh
        }, 300000); // 5 minutes

        return () => clearInterval(interval);
    }, [fetchChartData]);

    const handleRefresh = () => {
        fetchChartData(true);
    };

    // Smooth number animation hook
    const useCountUp = (end, duration = 1000) => {
        const [count, setCount] = useState(0);
        
        useEffect(() => {
            let startTime;
            let animationFrame;
            
            const animate = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const progress = timestamp - startTime;
                const percentage = Math.min(progress / duration, 1);
                
                setCount(Math.floor(end * percentage));
                
                if (percentage < 1) {
                    animationFrame = requestAnimationFrame(animate);
                }
            };
            
            animationFrame = requestAnimationFrame(animate);
            return () => cancelAnimationFrame(animationFrame);
        }, [end, duration]);
        
        return count;
    };

    // Animated metric values
    const animatedTotalProducts = useCountUp(totalProducts);
    const animatedLowStock = useCountUp(lowStockItems);
    const animatedPendingTransactions = useCountUp(pendingTransactions);
    const animatedPendingUsers = useCountUp(pendingUsers);

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header Dashboard dengan smooth fade-in */}
                <div className="opacity-0 animate-fadeIn" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-extrabold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
                                Dashboard <span className="text-transparent bg-gradient-to-r from-green-600 to-green-500 bg-clip-text">{managerUsername}</span>
                            </h1>
                            <p className="text-lg text-gray-600 opacity-90">
                                Selamat datang! Anda memiliki akses penuh terhadap manajemen produk, transaksi, dan pengguna.
                            </p>
                        </div>
                        
                        <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4 mt-4 md:mt-0 w-full md:w-auto order-first md:order-last">
                            {/* Date Range Selector dengan smooth transition */}
                            <div className="flex items-center space-x-2 w-full md:w-auto">
                                <label className="text-sm font-medium text-gray-700">Periode:</label>
                                <select
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 w-full md:w-auto hover:border-gray-400"
                                >
                                    <option value="7">7 Hari Terakhir</option>
                                    <option value="30">30 Hari Terakhir</option>
                                    <option value="90">3 Bulan Terakhir</option>
                                </select>
                            </div>
                            
                            {/* Refresh Button dengan loading state */}
                            <button
                                onClick={handleRefresh}
                                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center space-x-2 w-full md:w-auto transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                                disabled={isRefreshing}
                            >
                                <svg className={`w-4 h-4 transition-transform duration-300 ${isRefreshing ? 'animate-spin' : 'hover:rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span className="font-medium">{isRefreshing ? 'Memperbarui...' : 'Refresh'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Metrics Cards dengan stagger animation */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {loadingCharts ? (
                        <>
                            <MetricCardSkeleton />
                            <MetricCardSkeleton />
                            <MetricCardSkeleton />
                            <MetricCardSkeleton />
                        </>
                    ) : (
                        <>
                            <div className="opacity-0 animate-slideInUp" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Total Produk</p>
                                            <p className="text-3xl font-bold text-blue-600 tabular-nums">{animatedTotalProducts}</p>
                                        </div>
                                        <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors duration-300">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="opacity-0 animate-slideInUp" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
                                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Stok Menipis</p>
                                            <p className="text-3xl font-bold text-red-600 tabular-nums">{animatedLowStock}</p>
                                        </div>
                                        <div className="p-3 bg-red-100 rounded-full transition-colors duration-300">
                                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.764 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="opacity-0 animate-slideInUp" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
                                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Transaksi Pending</p>
                                            <p className="text-3xl font-bold text-yellow-600 tabular-nums">{animatedPendingTransactions}</p>
                                        </div>
                                        <div className="p-3 bg-yellow-100 rounded-full transition-colors duration-300">
                                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="opacity-0 animate-slideInUp" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
                                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">User Pending</p>
                                            <p className="text-3xl font-bold text-purple-600 tabular-nums">{animatedPendingUsers}</p>
                                        </div>
                                        <div className="p-3 bg-purple-100 rounded-full transition-colors duration-300">
                                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Loading / Error States untuk Charts */}
                {loadingCharts ? (
                    <div className="opacity-0 animate-fadeIn grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
                        {/* Use ChartSkeleton for each chart area */}
                        <ChartSkeleton /> 
                        <ChartSkeleton />
                    </div>
                ) : errorCharts ? (
                    <div className="opacity-0 animate-slideInUp" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
                        <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg shadow-md">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-bold text-red-800">Gagal Memuat Dashboard!</h3>
                                    <p className="mt-1 text-red-700">{errorCharts}</p>
                                    <p className="mt-2 text-sm text-red-600">Pastikan backend server berjalan di http://localhost:5000</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Chart Section dengan smooth animation */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="opacity-0 animate-slideInLeft" style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}>
                                <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                                    <h3 className="text-xl font-bold text-gray-800 mb-4">Distribusi Stok per Kategori</h3>
                                    <div className="h-80 flex items-center justify-center">
                                        {inventorySummary.length > 0 ? (
                                            <PieChart data={inventorySummary} title="Distribusi Stok per Kategori" />
                                        ) : (
                                            <div className="text-center">
                                                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse"></div>
                                                <p className="text-gray-500">Tidak ada data stok untuk ditampilkan.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="opacity-0 animate-slideInRight" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
                                <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
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
                                                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse"></div>
                                                <p className="text-gray-500">
                                                    Tidak ada data transaksi dalam {dateRange} hari terakhir.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top Selling Products Section */}
                        <div className="opacity-0 animate-slideInUp" style={{ animationDelay: '0.9s', animationFillMode: 'forwards' }}>
                            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Top 3 Barang Terlaris</h3>
                                {topSellingProducts.length > 0 ? (
                                    <div className="space-y-3">
                                        {topSellingProducts.map((product, index) => (
                                            <div 
                                                key={index} 
                                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                                style={{ 
                                                    opacity: 0, 
                                                    animation: `slideInUp 0.5s ease-out ${1 + index * 0.1}s forwards` 
                                                }}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                                        index === 0 ? 'bg-yellow-500' : 
                                                        index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                                                    }`}>
                                                        {index + 1}
                                                    </div>
                                                    <p className="text-lg font-medium text-gray-800">{product.namaProduk}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-semibold text-green-600">{product.total_quantity_sold}</p>
                                                    <p className="text-sm text-gray-500">unit terjual</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                        <p className="font-medium">Belum ada data barang terlaris</p>
                                        <p className="text-sm">Pastikan ada transaksi 'keluar' yang sudah di-approve</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Navigation Cards dengan stagger animation */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="opacity-0 animate-slideInUp" style={{ animationDelay: '1.1s', animationFillMode: 'forwards' }}>
                                <Link
                                    to="/inventory"
                                    className="block bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 group"
                                >
                                    <div className="flex items-center mb-3">
                                        <div className="p-3 bg-blue-500 rounded-xl mr-4 group-hover:bg-blue-600 transition-all duration-300 group-hover:scale-110">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                        </div>
                                        <h3 className="font-bold text-blue-800 text-xl group-hover:text-blue-900 transition-colors duration-300">Lihat Inventaris</h3>
                                    </div>
                                    <p className="text-blue-700 group-hover:text-blue-800 transition-colors duration-300">Kelola daftar produk dan stok gudang.</p>
                                </Link>
                            </div>

                            <div className="opacity-0 animate-slideInUp" style={{ animationDelay: '1.2s', animationFillMode: 'forwards' }}>
                                <Link
                                    to="/transactions"
                                    className="block bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 group relative"
                                >
                                    <div className="flex items-center mb-3">
                                        <div className="p-3 bg-green-500 rounded-xl mr-4 group-hover:bg-green-600 transition-all duration-300 group-hover:scale-110">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                            </svg>
                                        </div>
                                        <h3 className="font-bold text-green-800 text-xl group-hover:text-green-900 transition-colors duration-300">Lihat Transaksi</h3>
                                    </div>
                                    <p className="text-green-700 group-hover:text-green-800 transition-colors duration-300">Tinjau dan kelola semua riwayat transaksi.</p>
                                    {pendingTransactions > 0 && (
                                        <div className="absolute -top-2 -right-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-400 text-yellow-900 animate-pulse shadow-lg">
                                            {pendingTransactions}
                                        </div>
                                    )}
                                </Link>
                            </div>

                            <div className="opacity-0 animate-slideInUp" style={{ animationDelay: '1.3s', animationFillMode: 'forwards' }}>
                                <Link
                                    to="/users"
                                    className="block bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 group relative"
                                >
                                    <div className="flex items-center mb-3">
                                        <div className="p-3 bg-purple-500 rounded-xl mr-4 group-hover:bg-purple-600 transition-all duration-300 group-hover:scale-110">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="font-bold text-purple-800 text-xl group-hover:text-purple-900 transition-colors duration-300">Manajemen Pengguna</h3>
                                    </div>
                                    <p className="text-purple-700 group-hover:text-purple-800 transition-colors duration-300">Setujui pengguna baru & kelola akses sistem.</p>
                                    {pendingUsers > 0 && (
                                        <div className="absolute -top-2 -right-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-400 text-purple-900 animate-pulse shadow-lg">
                                            {pendingUsers}
                                        </div>
                                    )}
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Custom CSS untuk animasi */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideInUp {
                    from { 
                        opacity: 0; 
                        transform: translateY(30px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0); 
                    }
                }

                @keyframes slideInLeft {
                    from { 
                        opacity: 0; 
                        transform: translateX(-30px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateX(0); 
                    }
                }

                @keyframes slideInRight {
                    from { 
                        opacity: 0; 
                        transform: translateX(30px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateX(0); 
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.6s ease-out;
                }

                .animate-slideInUp {
                    animation: slideInUp 0.6s ease-out;
                }

                .animate-slideInLeft {
                    animation: slideInLeft 0.6s ease-out;
                }

                .animate-slideInRight {
                    animation: slideInRight 0.6s ease-out;
                }

                /* Smooth number transition */
                .tabular-nums {
                    font-variant-numeric: tabular-nums;
                }

                /* Hover effects enhancement */
                .group:hover .group-hover\\:scale-110 {
                    transform: scale(1.1);
                }

                /* Loading shimmer effect */
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: .5;
                    }
                }

                /* Smooth scrolling */
                html {
                    scroll-behavior: smooth;
                }

                /* Better focus states */
                button:focus,
                select:focus,
                a:focus {
                    outline: 2px solid #10B981;
                    outline-offset: 2px;
                }

                /* Improved loading spinner */
                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }

                .animate-spin {
                    animation: spin 1s linear infinite;
                }

                /* Responsive improvements */
                @media (max-width: 768px) {
                    .animate-slideInUp,
                    .animate-slideInLeft,
                    .animate-slideInRight {
                        animation-delay: 0s !important;
                        animation-duration: 0.4s;
                    }
                }
            `}</style>
        </DashboardLayout>
    );
}