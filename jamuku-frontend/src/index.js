// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Atau file CSS global Anda
import App from './App';

// HAPUS BARIS INI:
// import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);