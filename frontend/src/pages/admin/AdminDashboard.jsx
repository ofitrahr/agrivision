import React, { useEffect, useState } from 'react';
import api from '../../shared/api/axios';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

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
                <button className="primary-btn" onClick={() => window.location.href = '/admin/companies'}>
                    Lihat Daftar Company ➡
                </button>
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
