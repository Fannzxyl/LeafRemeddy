// src/components/charts/PieChart.jsx
import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({ data, title }) => {
  const chartData = {
    labels: data.map(item => item.kategori),
    datasets: [
      {
        label: 'Total Stok',
        data: data.map(item => item.total_stok),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)', // Merah
          'rgba(54, 162, 235, 0.6)', // Biru
          'rgba(255, 206, 86, 0.6)', // Kuning
          'rgba(75, 192, 192, 0.6)', // Hijau Teal
          'rgba(153, 102, 255, 0.6)', // Ungu
          'rgba(255, 159, 64, 0.6)',  // Oranye
          'rgba(199, 199, 199, 0.6)', // Abu-abu
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
          color: '#333', // Warna teks legend
        }
      },
      title: {
        display: true,
        text: title,
        color: '#333', // Warna teks judul
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
            if (context.parsed !== null) {
              label += context.parsed + ' unit';
            }
            return label;
          }
        }
      }
    },
  };

  return <Pie data={chartData} options={options} />;
};

export default PieChart;