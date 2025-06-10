import React, { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import axios from "axios";
import { Link } from "react-router-dom"; // <-- Import Link

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function TransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(''); // State untuk menyimpan role user yang sedang login

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserRole(payload.userRole);
        console.log("Frontend TransactionList: Current User Role from Token:", payload.userRole);
      } catch (e) {
        console.error("Failed to parse token payload in TransactionList:", e);
        setCurrentUserRole(''); // Reset role jika token rusak
      }
    }
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Token tidak ditemukan. Silakan login.");
        setIsLoading(false);
        return;
      }

      const res = await axios.get(`${API_BASE}/api/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(res.data);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(err.response?.data?.message || "Gagal memuat transaksi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async (transactionId, action) => {
    if (currentUserRole !== 'MANAGER') {
      alert("Akses ditolak. Hanya Manager yang bisa melakukan aksi ini.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Anda tidak memiliki izin. Silakan login.");
        return;
      }
      const response = await axios.put(
        `${API_BASE}/api/transactions/${transactionId}/approve`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message);
      fetchTransactions(); // Refresh daftar transaksi setelah approval
    } catch (error) {
      console.error("Error processing approval:", error);
      const errorMessage = error.response?.data?.message || "Gagal memproses approval";
      alert(errorMessage);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Daftar Transaksi</h1>
        
        {/* Tombol "Tambah Transaksi" baru di sini */}
        <div className="mb-6">
          <Link
            to="/add-transaction" // Mengarah ke rute yang sudah kita definisikan di App.js
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
          >
            Tambah Transaksi Stok
          </Link>
        </div>

        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 shadow-md">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12 text-lg text-gray-600">
            <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Memuat data transaksi...
          </div>
        ) : (
          <div className="overflow-x-auto bg-white shadow-xl rounded-xl">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th key="th-tanggal" scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Tanggal</th><th key="th-user" scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">User</th><th key="th-produk" scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Produk</th><th key="th-jumlah" scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Jumlah</th><th key="th-tipe" scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Tipe</th><th key="th-status" scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th><th key="th-lokasi" scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Lokasi</th>
                  {currentUserRole === 'MANAGER' && (
                    <th key="th-aksi" scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length === 0 ? (
                  <tr><td colSpan={currentUserRole === 'MANAGER' ? "8" : "7"} className="px-6 py-6 text-center text-gray-500 text-base">Tidak ada transaksi yang ditemukan.</td></tr>
                ) : (
                  transactions.map((trx, i) => (
                    <tr
                      key={trx.id}
                      className={`
                        ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        hover:bg-blue-50 transition duration-150 ease-in-out
                        ${trx.status === 'pending' ? 'bg-yellow-50 hover:bg-yellow-100' : ''}
                      `}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {trx.tanggal?.split("T")[0]}
                      </td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {trx.created_by_name}
                      </td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {trx.transaction_type === 'add_product' && (
                          <span className="ml-2 px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                            Produk Baru
                          </span>
                        )}
                        {trx.namaProduk}
                      </td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {trx.transaction_type === 'add_product' && trx.status === 'pending'
                            ? trx.requested_stok
                            : trx.jumlah
                        }
                      </td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${ trx.tipe === 'masuk' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' }`}>
                          {trx.tipe}
                        </span>
                      </td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${ trx.status === 'approved' ? 'bg-green-100 text-green-800' :
                              trx.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800' }`}>
                          {trx.status}
                        </span>
                      </td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {trx.id_lokasi}
                      </td>
                      {currentUserRole === 'MANAGER' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {trx.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproval(trx.id, 'approve')}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => handleApproval(trx.id, 'reject')}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                              >
                                Tolak
                              </button>
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}