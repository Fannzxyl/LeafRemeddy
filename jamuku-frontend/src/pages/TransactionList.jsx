// src/pages/TransactionList.jsx
import React, { useEffect, useState } from "react";

export default function TransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/transactions", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        // Ensure data is an array
        if (Array.isArray(data)) {
          setTransactions(data);
        } else if (data && Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
        } else {
          setError("Data transaksi tidak valid");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Gagal memuat transaksi");
      });
  }, []);

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Daftar Transaksi</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Tanggal</th>
            <th className="border p-2">User</th>
            <th className="border p-2">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, index) => (
            <tr key={index}>
              <td className="border p-2">{tx.tanggal || tx.date}</td>
              <td className="border p-2">{tx.username || tx.user || "-"}</td>
              <td className="border p-2">{tx.jumlah}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
