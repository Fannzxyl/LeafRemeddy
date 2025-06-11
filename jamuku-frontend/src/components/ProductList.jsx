import React from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import useSWR, { useSWRConfig } from "swr"; // Ini berfungsi untuk manajemen state data dengan caching.
import DashboardLayout from "../layouts/DashboardLayout"; // Ini berfungsi untuk layout dasar dashboard.

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000"; // Ini berfungsi untuk base URL API.

// Ini berfungsi untuk menampilkan daftar produk dalam bentuk tabel.
export default function ProductList() {
    // Ini berfungsi untuk memicu re-fetch data SWR.
    const { mutate } = useSWRConfig();
    // Ini berfungsi untuk menyimpan peran (role) user yang sedang login.
    const [currentUserRole, setCurrentUserRole] = React.useState(null); // Menggunakan React.useState untuk konsistensi

    // Ini berfungsi untuk fetcher data SWR.
    const fetcher = async (url) => {
        const token = localStorage.getItem('token'); // Ini berfungsi untuk mendapatkan token otorisasi dari localStorage.

        if (!token) {
            const authError = new Error("Token tidak ditemukan. Silakan login.");
            authError.status = 403; // Memberi status 403 untuk penanganan error.
            throw authError;
        }

        const res = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}` // Ini berfungsi untuk menyertakan token di header.
            }
        });

        // Ini berfungsi untuk mendapatkan role user dari token setelah fetch berhasil (opsional, bisa juga dari useEffect terpisah).
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setCurrentUserRole(payload.userRole);
        } catch (e) {
            console.error("Failed to parse token payload in fetcher:", e);
            setCurrentUserRole('');
        }
        
        return res.data; // Ini berfungsi untuk mengembalikan data dari respons.
    };

    // Ini berfungsi untuk mengambil data produk menggunakan useSWR.
    const { data, error, isLoading } = useSWR(`${API_BASE}/api/inventory`, fetcher);

    // Ini berfungsi untuk menampilkan pesan error jika terjadi kesalahan.
    if (error) {
        let errorMessage = "Gagal memuat data produk.";
        if (error.response?.status === 403 || error.status === 403) {
            errorMessage = "Akses ditolak. Anda tidak memiliki izin atau sesi Anda telah berakhir. Silakan login kembali.";
        } else if (error.response?.status === 401 || error.status === 401) {
            errorMessage = "Sesi Anda telah berakhir. Silakan login kembali.";
            // Opsional: Redirect ke login page
            // navigate('/login'); // Jika Anda memiliki navigate di scope ini
        } else {
            errorMessage += ` ${error.message}`;
        }
        return (
            <DashboardLayout>
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 shadow-md">
                        <strong className="font-bold">Error!</strong>
                        <span className="block sm:inline ml-2">{errorMessage}</span>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Ini berfungsi untuk menampilkan loading state.
    if (isLoading || !data) return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8 text-center text-lg text-gray-600">
                <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memuat daftar produk...
            </div>
        </DashboardLayout>
    );

    // Ini berfungsi untuk menghapus produk dari database (hanya untuk Manager).
    const deleteProduct = async (id) => {
        // Ini berfungsi untuk memeriksa peran user sebelum menghapus.
        if (currentUserRole !== 'MANAGER') {
            alert("Akses ditolak. Hanya Manager yang dapat menghapus produk.");
            return;
        }

        // Ini berfungsi untuk konfirmasi penghapusan.
        const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus produk ini? Semua data transaksi terkait juga akan dihapus.");
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem('token'); // Ini berfungsi untuk mendapatkan token otorisasi.
            await axios.delete(`${API_BASE}/api/inventory/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            mutate(`${API_BASE}/api/inventory`); // Ini berfungsi untuk me-revalidate data setelah penghapusan.
            alert("Produk berhasil dihapus!");
        } catch (err) {
            alert("Gagal menghapus produk: " + (err.response?.data?.message || err.message));
            console.error("Error deleting product:", err);
        }
    };

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Daftar Produk</h1>
                <Link
                    to="/add-product"
                    className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 mb-6"
                >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Tambah Produk
                </Link>
                
                {/* Tabel Daftar Produk */}
                <div className="overflow-x-auto bg-white shadow-xl rounded-xl">
                    <table className="min-w-full text-sm text-left text-gray-700">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">No</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Nama Produk</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Kategori</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Stok</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Satuan</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Lokasi</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-6 text-center text-gray-500 text-base">
                                        Tidak ada produk yang ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                data.map((product, index) => (
                                    <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-center">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                            {product.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                            {product.kategori}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                            {product.stok}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                            {product.satuan}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span
                                                className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    product.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                                }`}
                                            >
                                                {product.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                            {product.lokasi}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center space-x-2">
                                            <Link
                                                to={`/edit/${product.id}`}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                            >
                                                Edit
                                            </Link>
                                            {currentUserRole === 'MANAGER' && (
                                                <button
                                                    onClick={() => deleteProduct(product.id)}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                                >
                                                    Hapus
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}