// src/components/charts/BarChart.jsx
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = ({ data, title }) => {
  // PERUBAHAN DI SINI: Gunakan item.month_year dan format untuk bulan/tahun
  const labels = data.map(item => {
    // Membuat tanggal dari YYYY-MM dengan menambahkan '-01' untuk kompatibilitas yang lebih baik
    const date = new Date(`${item.month_year}-01`);
    // Memastikan objek tanggal valid sebelum memformat
    if (isNaN(date.getTime())) {
      return item.month_year; // Fallback jika tanggal tidak valid
    }
    return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Total Masuk',
        data: data.map(item => item.total_masuk),
        backgroundColor: 'rgba(75, 192, 192, 0.6)', // Hijau Teal
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Total Keluar',
        data: data.map(item => item.total_keluar),
        backgroundColor: 'rgba(255, 99, 132, 0.6)', // Merah
        borderColor: 'rgba(255, 99, 132, 1)',
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
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y + ' unit';
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#666',
        },
        grid: {
          display: false,
        }
      },
      y: {
        ticks: {
          color: '#666',
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.2)',
        }
      }
    }
  };

  return <Bar data={chartData} options={options} />;
};

export default BarChart;