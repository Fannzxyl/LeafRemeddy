import React, { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import axios from "axios";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    // ❗ Tambahan validasi role di client-side
    if (role !== "MANAGER") {
      setMessage("Akses ditolak. Hanya Manager yang dapat melihat daftar pengguna.");
      setLoading(false);
      return;
    }

    const fetchUsers = async () => {
      try {
        const res = await axios.get("/api/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (Array.isArray(res.data)) {
          setUsers(res.data);
        } else {
          setMessage(res.data?.message || "Data tidak valid");
        }
      } catch (err) {
        console.error(err);
        setMessage("Terjadi kesalahan saat mengambil data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <DashboardLayout>
      <div className="p-6 text-gray-800">
        <h2 className="text-2xl font-bold mb-4 text-green-700">Daftar Pengguna</h2>
        {loading ? (
          <p>Loading...</p>
        ) : message ? (
          <p className="text-red-500">{message}</p>
        ) : (
          <table className="min-w-full bg-white text-sm text-gray-800 shadow rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-2">ID</th>
                <th className="text-left px-4 py-2">Username</th>
                <th className="text-left px-4 py-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-gray-300">
                  <td className="px-4 py-2">{user.id}</td>
                  <td className="px-4 py-2">{user.username}</td>
                  <td className="px-4 py-2">{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}