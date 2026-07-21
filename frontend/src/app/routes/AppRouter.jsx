import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../../pages/auth/Login';

// Komponen sementara (nanti di rombak ygy)
const DashboardPlaceholder = () => (
  <div style={{ textAlign: 'center', padding: '100px', fontFamily: 'sans-serif' }}>
    <h1>Anda berhasil Login!</h1>
    <p>Ini adalah halaman Dashboard sementara</p>
    <button 
      onClick={() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }}
      style={{ padding: '10px 20px', background: 'red', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '20px' }}
    >
      Logout
    </button>
  </div>
);

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Route sementara sebelum membuat Proteksi Route */}
        <Route path="/dashboard" element={<DashboardPlaceholder />} />
        
        {/* Default route redirect ke login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
