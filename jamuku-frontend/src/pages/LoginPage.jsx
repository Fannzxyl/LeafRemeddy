import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import GlitterEffect from "./GlitterEffect";

export default function LoginPage() {
  const navigate = useNavigate();
  const [particlesOptions, setParticlesOptions] = useState({});

  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };

  useEffect(() => {
    fetch("/particles.json")
      .then((res) => res.json())
      .then((data) => setParticlesOptions(data));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Login gagal");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      localStorage.setItem("role", data.role);

      if (data.role === "MANAGER") {
        navigate("/dashboard-manager");
      } else if (data.role === "STAZ") {
        navigate("/dashboard-staz");
      } else {
        navigate("/homepage");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat login.");
      console.error(err);
    }
  };

  return (
    <div className="relative w-full min-h-screen text-white scroll-smooth">
      {/* Background dan Partikel */}
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

      {/* Header */}
      <div className="absolute top-6 left-6 z-30">
        <motion.span
          className="text-green-400 text-xl font-pixel"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          Leaf Remedy
        </motion.span>
      </div>
      <div className="absolute top-6 right-6 z-30">
        <button
          onClick={() => navigate("/signup")}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded shadow-lg transition-transform transform hover:scale-105"
        >
          Sign Up
        </button>
      </div>

      {/* Section 1: Login */}
      <section
        id="section-login"
        className="w-full h-screen flex items-center justify-center px-4"
      >
        <motion.div
          className="relative bg-black/20 rounded-2xl p-8 w-[350px] border border-green-400/30 backdrop-blur-sm z-20"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <GlitterEffect className="absolute -top-2 -left-2" />
          <GlitterEffect className="absolute -bottom-2 -right-2" />
          <h2 className="text-3xl font-bold text-center mb-6">Welcome Back</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block mb-1">Username</label>
              <input
                name="username"
                type="text"
                className="w-full px-3 py-2 rounded bg-gray-900/30 focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block mb-1">Password</label>
              <input
                name="password"
                type="password"
                className="w-full px-3 py-2 rounded bg-gray-900/30 focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded transition-transform transform hover:scale-105"
            >
              Login
            </button>
          </form>
        </motion.div>
      </section>

      {/* Section 2: Start the Journey */}
      <section
        id="section-journey"
        className="min-h-screen flex flex-col items-center justify-center text-center px-4"
      >
        <h1 className="text-5xl font-bold mb-4">VISITE</h1>
        <p className="text-lg mb-8 max-w-md">
          Explore nature and comedy in a whole new way through{" "}
          <span className="italic">Leaf Comedy</span>'s herbal journeys.
        </p>
        <button
          className="bg-white text-black font-semibold py-2 px-6 rounded-full hover:bg-gray-200 transition"
          onClick={() => navigate("/homepage")}
        >
          Start the Journey
        </button>
      </section>
    </div>
  );
}