// src/layouts/DashboardLayout.jsx
import React from "react";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-6 bg-gray-50 min-h-screen">{children}</main>
    </div>
  );
}