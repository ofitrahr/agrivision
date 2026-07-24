import React, { useEffect, useState, useContext } from 'react';
import api from '../../shared/api/axios';
import { AuthContext } from '../../features/auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const ManagerDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/manager/dashboard/stats');
                if (response.data.success) setStats(response.data.data);
            } catch (error) {
                console.error("Gagal mengambil stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div style={{padding: '30px'}}>Memuat Dashboard...</div>;

    return (
        <div style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ color: '#1B4332' }}>Dashboard Manajer</h1>
                <button onClick={handleLogout} style={{ background: '#ef4444', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    Logout
                </button>
            </div>
            <p>Selamat datang! Berikut adalah ringkasan perusahaan Anda.</p>
            
            <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
                <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#6b7280' }}>Total Lahan</h3>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#2D6A4F' }}>{stats?.total_farms || 0}</p>
                </div>
                <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#6b7280' }}>Total Petani</h3>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#2D6A4F' }}>{stats?.total_farmers || 0}</p>
                </div>
                </div>

            <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
                <button className="primary-btn" onClick={() => navigate('/manager/gis')} style={{ background: '#2563eb', color: 'white' }}>
                    Peta Lahan & Blok
                </button>
                <button className="primary-btn" onClick={() => navigate('/manager/traceability')} style={{ background: '#d97706', color: 'white' }}>
                    Traceability
                </button>
                <button className="primary-btn" onClick={() => navigate('/manager/farmers')} style={{ background: '#059669', color: 'white' }}>
                    Kelola Data Pekerja
                </button>
                <button className="primary-btn" onClick={() => navigate('/manager/profile')} style={{ background: '#374151', color: 'white' }}>
                    Pengaturan Profil & Logo
                </button>
            </div>
        </div>
    );
};

export default ManagerDashboard;
