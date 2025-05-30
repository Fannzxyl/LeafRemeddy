import React, { useEffect, useState, useCallback } from "react"; // <-- Tambah useCallback
import DashboardLayout from "../layouts/DashboardLayout";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState('');

  // PERBAIKAN: Bungkus fetchUsers dengan useCallback
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Token tidak ditemukan. Silakan login.");
        setLoading(false);
        return;
      }

      // Validasi role di sini juga, agar tidak fetch jika role tidak sesuai
      // Perhatikan: currentUserRole mungkin belum terisi di render pertama,
      // jadi tambahkan logika untuk itu.
      if (currentUserRole && currentUserRole !== 'MANAGER' && currentUserRole !== 'STAZ') {
        setError("Akses ditolak. Silakan login sebagai Manager atau STAZ.");
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_BASE}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        setError(res.data?.message || "Data pengguna tidak valid");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.response?.data?.message || "Terjadi kesalahan saat mengambil data pengguna.");
    } finally {
      setLoading(false);
    }
  }, [currentUserRole]); // <-- Dependency useCallback: currentUserRole, API_BASE (jika API_BASE bisa berubah)

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserRole(payload.userRole);
        console.log("Frontend UserList: Current User Role from Token:", payload.userRole);
      } catch (e) {
        console.error("Failed to parse token payload in UserList:", e);
        setCurrentUserRole('');
      }
    }

    // Panggil fetchUsers setelah role didapat atau jika tidak ada token
    // Ini akan memicu fetchUsers hanya setelah currentUserRole memiliki nilai awal
    // atau jika tidak ada token (yang akan ditangani oleh fetchUsers itu sendiri)
    if (token) { // Hanya fetch jika ada token
        fetchUsers();
    } else {
        setError("Token tidak ditemukan. Silakan login.");
        setLoading(false);
    }
  }, [fetchUsers]); // <-- PERBAIKAN: Tambahkan fetchUsers ke dependency array

  const handleApproval = async (userId, action) => {
    if (currentUserRole !== 'MANAGER') {
      alert("Akses ditolak. Hanya Manager yang bisa melakukan aksi ini.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Token tidak ditemukan. Silakan login.");
        return;
      }
      const response = await axios.put(
        `${API_BASE}/api/users/request/${userId}/approve`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message);
      fetchUsers();
    } catch (error) {
      console.error("Error processing user approval:", error);
      const errorMessage = error.response?.data?.message || "Gagal memproses persetujuan pengguna.";
      alert(errorMessage);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 text-gray-800">
        <h2 className="text-2xl font-bold mb-4 text-green-700">Daftar Pengguna</h2>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <table className="min-w-full bg-white text-sm text-gray-800 shadow rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-2">ID</th>
                <th className="text-left px-4 py-2">Username</th>
                <th className="text-left px-4 py-2">Role</th>
                <th className="text-left px-4 py-2">Status</th>
                {currentUserRole === 'MANAGER' && (
                  <th className="text-left px-4 py-2">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={currentUserRole === 'MANAGER' ? 5 : 4} className="text-center px-4 py-2 text-gray-500">
                    Tidak ada pengguna yang ditemukan.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t border-gray-300">
                    <td className="px-4 py-2">{user.id}</td>
                    <td className="px-4 py-2">{user.username}</td>
                    <td className="px-4 py-2">{user.role}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${user.status === 'active' ? 'bg-green-100 text-green-800' :
                          user.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'}`}>
                        {user.status}
                      </span>
                    </td>
                    {currentUserRole === 'MANAGER' && (
                      <td className="px-4 py-2 space-x-2">
                        {user.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleApproval(user.id, 'approve')}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => handleApproval(user.id, 'reject')}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                              Tolak
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-500">
                            {user.status === 'active' ? 'Sudah Aktif' : 'Ditolak'}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}