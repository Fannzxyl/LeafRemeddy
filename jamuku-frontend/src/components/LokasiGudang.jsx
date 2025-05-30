import React, { useEffect, useState, useCallback } from "react"; // <-- Tambah useCallback
import DashboardLayout from "../layouts/DashboardLayout";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function LokasiGudang() {
  const [locations, setLocations] = useState([]);
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const token = localStorage.getItem("token");

  // PERBAIKAN: Bungkus fetchLocations dengan useCallback
  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/api/locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocations(res.data);
    } catch (err) {
      console.error("Gagal mengambil data lokasi:", err);
      setError(err.response?.data?.message || "Gagal mengambil data lokasi.");
    } finally {
      setIsLoading(false);
    }
  }, [token]); // <-- Dependency useCallback: token

  useEffect(() => {
    if (!token) {
        setError("Token tidak ditemukan. Mohon login.");
        setIsLoading(false);
        return;
    }
    fetchLocations();
  }, [token, fetchLocations]); // <-- PERBAIKAN: Tambahkan fetchLocations ke dependency array

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (!token) {
          alert("Anda tidak memiliki izin. Silakan login.");
          return;
      }
      if (editingId) {
        await axios.put(
          `${API_BASE}/api/locations/${editingId}`,
          { nama, alamat },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Lokasi berhasil diupdate!");
      } else {
        await axios.post(
          `${API_BASE}/api/locations`,
          { nama, alamat },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Lokasi berhasil ditambahkan!");
      }
      setNama("");
      setAlamat("");
      setEditingId(null);
      fetchLocations();
    } catch (err) {
      console.error("Gagal simpan lokasi:", err.response?.data || err);
      setError(err.response?.data?.message || "Gagal simpan lokasi.");
      alert(err.response?.data?.message || "Gagal simpan lokasi.");
    }
  };

  const handleEdit = (lokasi) => {
    setNama(lokasi.nama);
    setAlamat(lokasi.alamat);
    setEditingId(lokasi.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus lokasi ini?")) return;
    setError("");
    try {
      if (!token) {
          alert("Anda tidak memiliki izin. Silakan login.");
          return;
      }
      await axios.delete(`${API_BASE}/api/locations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Lokasi berhasil dihapus!");
      fetchLocations();
    } catch (err) {
      console.error("Gagal hapus lokasi:", err.response?.data || err);
      setError(err.response?.data?.message || "Gagal hapus lokasi.");
      alert(err.response?.data?.message || "Gagal hapus lokasi.");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-green-700">Lokasi Gudang</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 shadow-md">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-4 bg-white p-4 rounded shadow"
        >
          <div>
            <label className="block font-semibold mb-1">Nama Lokasi</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Alamat</label>
            <textarea
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              rows="3"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            {editingId ? "Update" : "Tambah"} Lokasi
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setNama("");
                setAlamat("");
              }}
              className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded ml-2"
            >
              Batal
            </button>
          )}
        </form>

        {isLoading ? (
            <p>Memuat lokasi...</p>
        ) : (
            <table className="min-w-full bg-white shadow rounded text-sm">
            <thead className="bg-gray-100">
                <tr>
                    <th className="text-left px-4 py-2">ID</th>
                    <th className="text-left px-4 py-2">Nama</th>
                    <th className="text-left px-4 py-2">Alamat</th>
                    <th className="text-left px-4 py-2">Aksi</th>
                </tr>
            </thead>
            <tbody>
                {locations.length === 0 ? (
                    <tr>
                        <td colSpan="4" className="text-center p-4 text-gray-500">
                            Belum ada lokasi gudang.
                        </td>
                    </tr>
                ) : (
                    locations.map((lokasi) => (
                        <tr key={lokasi.id} className="border-t">
                            <td className="px-4 py-2">{lokasi.id}</td>
                            <td className="px-4 py-2">{lokasi.nama}</td>
                            <td className="px-4 py-2">{lokasi.alamat}</td>
                            <td className="px-4 py-2 space-x-2">
                                <button
                                    onClick={() => handleEdit(lokasi)}
                                    className="text-blue-600 hover:underline"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(lokasi.id)}
                                    className="text-red-600 hover:underline"
                                >
                                    Hapus
                                </button>
                            </td>
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