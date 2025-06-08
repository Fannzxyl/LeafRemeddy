import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function AddTransaction() {
  const [produkId, setProdukId] = useState("");
  const [produkList, setProdukList] = useState([]);
  const [jumlah, setJumlah] = useState("");
  const [tipe, setTipe] = useState("masuk");
  const [tanggal, setTanggal] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduk = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setMessage("Token tidak ditemukan. Silakan login ulang.");
          return;
        }
        
        const res = await axios.get(`${API_BASE}/api/inventory`, { // Endpoint untuk daftar inventaris
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setProdukList(res.data); // Data diharapkan memiliki id dan name (alias dari namaProduk)
      } catch (err) {
        console.error("Gagal mengambil produk:", err.response?.data?.message || err.message);
        setMessage("Gagal memuat daftar produk.");
      }
    };

    fetchProduk();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId"); // Pastikan Anda menyimpan userId di localStorage saat login

    if (!token) {
      setMessage("Anda belum login. Silakan login kembali.");
      navigate("/login"); 
      return;
    }
    if (!userId) {
        setMessage("ID pengguna tidak ditemukan di browser. Silakan login ulang.");
        return;
    }

    try {
      const dataToSend = {
        id_inventories: parseInt(produkId, 10),
        jumlah: parseInt(jumlah, 10),
        tipe: tipe,
        tanggal: tanggal,
        created_by: parseInt(userId, 10),
      };

      const res = await axios.post(`${API_BASE}/api/transactions/add`, dataToSend, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 201) {
        setMessage("Transaksi berhasil ditambahkan!");
        setProdukId("");
        setJumlah("");
        setTipe("masuk");
        setTanggal("");
        
        setTimeout(() => navigate("/transactions"), 1000);
      } else {
        setMessage(res.data?.message || "Gagal menambahkan transaksi.");
      }
    } catch (err) {
      console.error("Error saat mengirim transaksi:", err.response?.data || err);
      setMessage(err.response?.data?.message || "Terjadi kesalahan saat menambahkan transaksi.");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-md mx-auto bg-white shadow rounded">
        <h2 className="text-xl font-bold mb-4">Tambah Transaksi</h2>
        {message && (
          <p className={`text-sm mb-2 ${message.includes('berhasil') ? 'text-green-500' : 'text-red-500'}`}>
            {message}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Produk</label>
            <select
              value={produkId}
              onChange={(e) => setProdukId(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="">-- Pilih Produk --</option>
              {produkList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {/* Menggunakan 'name' karena kita sudah alias di backend */}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1">Jumlah</label>
            <input
              type="number"
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
              min={1}
            />
          </div>

          <div>
            <label className="block mb-1">Tipe Transaksi</label>
            <select
              value={tipe}
              onChange={(e) => setTipe(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="masuk">Barang Masuk</option>
              <option value="keluar">Barang Keluar</option>
            </select>
          </div>

          <div>
            <label className="block mb-1">Tanggal</label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
          >
            Kirim Transaksi
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}