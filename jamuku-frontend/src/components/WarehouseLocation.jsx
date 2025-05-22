import React, { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import axios from "axios";

export default function WarehouseLocation() {
  const [locations, setLocations] = useState([]);
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [editingId, setEditingId] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await axios.get("/api/warehouses", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLocations(res.data);
      } catch (err) {
        console.error("Gagal mengambil data lokasi:", err);
      }
    };

    fetchLocations();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(
          `/api/warehouses/${editingId}`,
          { nama, alamat },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          "/api/warehouses",
          { nama, alamat },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setNama("");
      setAlamat("");
      setEditingId(null);
      // Refresh setelah simpan
      const res = await axios.get("/api/warehouses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocations(res.data);
    } catch (err) {
      console.error("Gagal simpan lokasi:", err);
    }
  };

  const handleEdit = (lokasi) => {
    setNama(lokasi.nama);
    setAlamat(lokasi.alamat);
    setEditingId(lokasi.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus lokasi ini?")) return;
    try {
      await axios.delete(`/api/warehouses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Refresh setelah hapus
      const res = await axios.get("/api/warehouses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocations(res.data);
    } catch (err) {
      console.error("Gagal hapus lokasi:", err);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-green-700">Lokasi Gudang</h2>

        {/* Form Tambah / Edit Lokasi */}
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
        </form>

        {/* Tabel Lokasi */}
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
            {locations.map((lokasi) => (
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
            ))}
            {locations.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center p-4 text-gray-500">
                  Belum ada lokasi gudang.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
