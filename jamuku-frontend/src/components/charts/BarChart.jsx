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
  const safeData = Array.isArray(data) ? data : [];
  
  const labels = safeData.map(item => {
    const date = new Date(item.date);
    if (isNaN(date.getTime())) {
      // console.log('Invalid date:', item.date); // Biarkan log ini jika Anda ingin melihat tanggal tidak valid
      return item.date; // Fallback jika tanggal tidak valid
    }
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    // console.log(`Date formatted: ${item.date} -> ${formatted}`); // Hapus log ini
    return formatted;
  });

  const masukData = safeData.map(item => {
    const value = parseInt(item['Total Masuk'], 10) || 0;
    // console.log(`Processing Total Masuk: ${item['Total Masuk']} -> ${value}`); // Hapus log ini
    return value;
  });

  const keluarData = safeData.map(item => {
    const value = parseInt(item['Total Keluar'], 10) || 0;
    // console.log(`Processing Total Keluar: ${item['Total Keluar']} -> ${value}`); // Hapus log ini
    return value;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Total Masuk',
        data: masukData,
        backgroundColor: 'rgba(75, 192, 192, 0.6)', // Hijau Teal
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Total Keluar',
        data: keluarData,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  // console.log('Final chartData:', chartData); // Hapus log ini
  // console.log('=== End BarChart Debug ==='); // Hapus log ini

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
        beginAtZero: true,
        ticks: {
          color: '#666',
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.2)',
        }
      }
    }
  };

  if (safeData.length === 0) {
    // console.log('No data available, showing fallback message'); // Hapus log ini
    return <p>Data transaksi belum tersedia.</p>; 
  }

  return <Bar data={chartData} options={options} />;
};

export default BarChart;