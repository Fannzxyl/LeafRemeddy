import React from "react";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ children }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
            <Sidebar />
            <main className="ml-64 transition-all duration-300 min-h-screen">
                <div className="p-6">
                    <div className="max-w-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}