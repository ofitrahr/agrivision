import React, { useEffect, useState, useContext } from 'react';
import api from '../../shared/api/axios';
import { AuthContext } from '../../features/auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
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
                const response = await api.get('/admin/dashboard/stats');
                if (response.data.success) {
                    setStats(response.data.data);
                }
            } catch (error) {
                console.error("Gagal mengambil statistik", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div style={{padding: '30px'}}>Memuat data dashboard...</div>;

    return (
        <div style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: '#1B4332', margin: 0 }}>Dashboard Statistik Super Admin</h1>
                <div>
                    <button className="primary-btn" onClick={() => window.location.href = '/admin/companies'} style={{ marginRight: '10px' }}>
                        Lihat Daftar Company
                    </button>
                    <button className="danger-btn" onClick={handleLogout} style={{ background: '#ef4444', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        Logout
                    </button>
                </div>
            </div>
            
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div className="stat-card">
                    <h3>Total Company</h3>
                    <p>{stats?.total_companies || 0}</p>
                </div>
                <div className="stat-card">
                    <h3>Active Company</h3>
                    <p>{stats?.active_companies || 0}</p>
                </div>
                <div className="stat-card">
                    <h3>Total Lahan (Farms)</h3>
                    <p>{stats?.total_farms || 0}</p>
                </div>
                <div className="stat-card">
                    <h3>Total Users</h3>
                    <p>{stats?.total_users || 0}</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
