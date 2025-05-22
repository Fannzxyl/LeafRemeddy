import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AddProduct = () => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const saveProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!name || price === "" || isNaN(price)) {
      setError("Nama dan harga harus diisi dengan benar");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token"); // Ambil token
      await axios.post(
        "http://localhost:5000/api/products",
        {
          name: name,
          price: parseInt(price),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      navigate("/products"); // Redirect setelah berhasil
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setError(err.response?.data?.msg || err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto my-10 bg-white p-8 rounded-xl shadow shadow-slate-300">
      <form onSubmit={saveProduct} className="my-10">
        <div className="flex flex-col">
          <div className="mb-5">
            <label className="font-bold text-slate-700">Product Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full py-3 mt-1 border border-slate-200 rounded-lg px-3"
              placeholder="Product Name"
              required
            />
          </div>
          <div className="mb-5">
            <label className="font-bold text-slate-700">Price</label>
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full py-3 mt-1 border border-slate-200 rounded-lg px-3"
              placeholder="Price"
              required
            />
          </div>
          {error && (
            <div className="mb-5 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 font-bold text-white rounded-lg ${
              loading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-500"
            }`}
          >
            {loading ? "Processing..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
