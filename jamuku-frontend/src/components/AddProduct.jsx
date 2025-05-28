import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DashboardLayout from "../layouts/DashboardLayout";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function AddProduct() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    namaProduk: "",
    kategori: "",
    stok: "",
    satuan: "",
    status: "ACTIVE",
    id_lokasi: ""
  });

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/locations`);
        setLocations(response.data);
      } catch (error) {
        console.error("Error fetching locations:", error);
        alert("Gagal memuat data lokasi");
      }
    };

    fetchLocations();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.namaProduk || !formData.kategori || !formData.stok || !formData.satuan || !formData.id_lokasi) {
        alert("Semua field wajib diisi!");
        setLoading(false);
        return;
      }

      if (isNaN(formData.stok) || parseInt(formData.stok) < 0) {
        alert("Stok harus berupa angka positif!");
        setLoading(false);
        return;
      }

      await axios.post(`${API_BASE}/api/inventory`, {
        namaProduk: formData.namaProduk,
        kategori: formData.kategori,
        stok: parseInt(formData.stok),
        satuan: formData.satuan,
        status: formData.status,
        id_lokasi: parseInt(formData.id_lokasi)
      });

      alert("Produk berhasil ditambahkan!");
      navigate("/products");
    } catch (error) {
      console.error("Error adding product:", error);
      const errorMessage = error.response?.data?.message || "Gagal menambahkan produk";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Tambah Produk</h1>

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Produk
              </label>
              <input
                type="text"
                name="namaProduk"
                value={formData.namaProduk}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan nama produk"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori
              </label>
              <select
                name="kategori"
                value={formData.kategori}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Pilih Kategori</option>
                <option value="Herbal">Herbal</option>
                <option value="Imunitas">Imunitas</option>
                <option value="Pegal Linu">Pegal Linu</option>
                <option value="Stamina">Stamina</option>
                <option value="Detox">Detox</option>
                <option value="Pencernaan">Pencernaan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stok
              </label>
              <input
                type="number"
                name="stok"
                value={formData.stok}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan jumlah stok"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Satuan
              </label>
              <select
                name="satuan"
                value={formData.satuan}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Pilih Satuan</option>
                <option value="botol">Botol</option>
                <option value="box">Box</option>
                <option value="pcs">Pcs</option>
                <option value="kg">Kg</option>
                <option value="gram">Gram</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lokasi Gudang
              </label>
              <select
                name="id_lokasi"
                value={formData.id_lokasi}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Pilih Lokasi Gudang</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.nama} - {location.alamat}
                  </option>
                ))}
              </select>
            </div>

            {locations.length === 0 && (
              <div className="text-yellow-600 text-sm">
                Loading lokasi gudang...
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-3 rounded-md text-white font-medium ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {loading ? "Menyimpan..." : "Tambah Produk"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/products")}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
