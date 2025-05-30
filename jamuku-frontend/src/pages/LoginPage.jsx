import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import GlitterEffect from "./GlitterEffect";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function LoginPage() {
  const navigate = useNavigate();
  const [particlesOptions, setParticlesOptions] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState(localStorage.getItem("rememberedUsername") || "");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };

  useEffect(() => {
    fetch("/particles.json")
      .then((res) => res.json())
      .then((data) => setParticlesOptions(data));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token) {
      if (role === "MANAGER") {
        navigate("/dashboard-manager");
      } else if (role === "STAZ") {
        navigate("/dashboard-staz");
      } else {
        navigate("/");
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const response = await axios.post(`${API_BASE}/api/login`, {
        username: username,
        password: password,
      });

      console.log("Response from backend:", response.data); // LOG 1: Lihat respons penuh dari backend
      console.log("Token received:", response.data.token); // LOG 2: Pastikan token ada di respons
      console.log("Role received:", response.data.role);   // LOG 3: Pastikan role ada di respons

      localStorage.setItem("token", response.data.token);
      // PERBAIKI INI: Backend mengembalikan 'userName' (camelCase), bukan 'username' (lowercase)
      localStorage.setItem("username", response.data.userName); // Ambil 'userName' dari respons backend
      localStorage.setItem("role", response.data.role);

      // LOG 4: Konfirmasi apa yang baru saja disimpan
      console.log("Token stored in localStorage:", localStorage.getItem('token'));
      console.log("Username stored in localStorage:", localStorage.getItem('username'));
      console.log("Role stored in localStorage:", localStorage.getItem('role'));


      setMsg(response.data.message);
      alert(response.data.message);

      if (response.data.role === "MANAGER") {
        navigate("/dashboard-manager");
      } else if (response.data.role === "STAZ") {
        navigate("/dashboard-staz");
      } else {
        navigate("/homepage");
      }
    } catch (error) {
      if (error.response) {
        setMsg(error.response.data.message || "Login gagal.");
        alert(error.response.data.message || "Login gagal.");
      } else {
        setMsg("Terjadi kesalahan jaringan atau server.");
        alert("Terjadi kesalahan jaringan atau server.");
      }
      console.error(error);
    }
  };

  return (
    <div className="relative w-full min-h-screen text-white scroll-smooth">
      <div
        className="fixed inset-0 bg-cover bg-center -z-10"
        style={{
          backgroundImage:
            "url('https://i.pinimg.com/originals/b6/76/dc/b676dc712d7ea4c837e0993a30156f26.gif')",
        }}
      />
      <div className="fixed inset-0 bg-black/50 -z-10" />
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={particlesOptions}
        className="fixed inset-0 -z-10"
      />

      <div className="absolute top-6 left-6 z-30">
        <motion.span
          className="text-green-400 text-xl font-pixel"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1 }}
        >
          Leaf Remedy
        </motion.span>
      </div>
      <div className="absolute top-6 right-6 z-30">
        <button
          onClick={() => navigate("/signup")}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded shadow-lg transition-transform hover:scale-105"
        >
          Sign Up
        </button>
      </div>

      <section className="w-full h-screen flex items-center justify-center px-4">
        <motion.div
          className="relative bg-black/20 rounded-2xl p-8 w-[350px] border border-green-400/30 backdrop-blur-sm z-20"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <GlitterEffect className="absolute -top-2 -left-2" />
          <GlitterEffect className="absolute -bottom-2 -right-2" />
          <h2 className="text-3xl font-bold text-center mb-6">Welcome Back</h2>
          {msg && (
            <p className={`text-center mb-4 ${msg.includes("berhasil") ? "text-green-400" : "text-red-400"}`}>
              {msg}
            </p>
          )}
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block mb-1">Username</label>
              <input
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded bg-gray-900/30 focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block mb-1">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-gray-900/30 focus:outline-none focus:ring-2 focus:ring-green-400 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white text-xl"
                >
                  {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded transition-transform transform hover:scale-105"
            >
              Login
            </button>
          </form>
          <p className="text-center text-sm text-white mt-4">
            Belum punya akun? <Link to="/signup" className="text-green-400 hover:underline">Daftar di sini</Link>
          </p>
        </motion.div>
      </section>
    </div>
  );
}