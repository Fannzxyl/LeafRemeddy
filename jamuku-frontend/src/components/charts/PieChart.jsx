import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({ data, title }) => {
  const safeData = Array.isArray(data) ? data : [];

  const chartData = {
    // --- KOREKSI DI SINI ---
    // Backend mengirim 'name' untuk kategori, bukan 'kategori'
    labels: safeData.map(item => item.name),
    datasets: [
      {
        label: 'Total Stok',
        // --- KOREKSI DI SINI ---
        // Backend mengirim 'value' untuk total stok, bukan 'total_stok'
        data: safeData.map(item => parseInt(item.value, 10) || 0),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',   // Merah
          'rgba(54, 162, 235, 0.6)',  // Biru
          'rgba(255, 206, 86, 0.6)',   // Kuning
          'rgba(75, 192, 192, 0.6)',   // Hijau
          'rgba(153, 102, 255, 0.6)',  // Ungu
          'rgba(255, 159, 64, 0.6)',   // Oranye
          'rgba(199, 199, 199, 0.6)',  // Abu-abu
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#333',
        }
      },
      title: {
        display: true,
        text: title,
        color: '#333',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null && context.parsed !== undefined) {
              label += context.parsed + ' unit';
            }
            return label;
          }
        }
      }
    },
  };

  if (safeData.length === 0) {
    return <p>Data stok per kategori belum tersedia.</p>;
  }

  return <Pie data={chartData} options={options} />;
};

export default PieChart;