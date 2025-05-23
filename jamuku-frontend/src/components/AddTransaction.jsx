import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";

export default function AddTransaction() {
  const [produk, setProduk] = useState("");
  const [total, setTotal] = useState("");
  const [tipe, setTipe] = useState("masuk");
  const [tanggal, setTanggal] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ produk, total, tipe, tanggal }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Gagal menambahkan transaksi");
      } else {
        setMessage("Transaksi berhasil dikirim");
        setTimeout(() => navigate("/transactions"), 1000);
      }
    } catch (err) {
      console.error(err);
      setMessage("Terjadi kesalahan");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-md mx-auto bg-white shadow rounded">
        <h2 className="text-xl font-bold mb-4">Tambah Transaksi</h2>

        {message && <p className="text-sm text-red-500 mb-2">{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Nama Produk</label>
            <input
              type="text"
              value={produk}
              onChange={(e) => setProduk(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block mb-1">Jumlah</label>
            <input
              type="number"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
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
