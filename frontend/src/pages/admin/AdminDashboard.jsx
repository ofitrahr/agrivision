import React, { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../shared/components/UI/StatCard';
import Card from '../../shared/components/UI/Card';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [recentCompanies, setRecentCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch stats and companies concurrently
                const [statsRes, companiesRes] = await Promise.all([
                    api.get('/admin/dashboard/stats'),
                    api.get('/admin/companies')
                ]);

                if (statsRes.data.success) {
                    setStats(statsRes.data.data);
                }
                
                if (companiesRes.data.success) {
                    // Get only the 5 most recent companies
                    setRecentCompanies(companiesRes.data.data.slice(0, 5));
                }
            } catch (error) {
                console.error("Gagal mengambil data dashboard", error);
            } finally {
                // Simulate network delay for skeleton loading
                setTimeout(() => setLoading(false), 800);
            }
        };

        fetchData();
    }, []);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Super Admin Dashboard</h1>
                    <p className="page-subtitle">Ringkasan sistem dan perusahaan yang terdaftar.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-ghost" onClick={() => navigate('/admin/companies')}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>settings</span>
                        Kelola Sistem
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/admin/companies')}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                        Tambah Klien Baru
                    </button>
                </div>
            </div>
            
            {/* Overview Cards */}
            <div className="stats-grid">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="stat-card" aria-busy="true">
                            <div className="skeleton-text" style={{ width: '40px', height: '14px', marginBottom: '12px' }}></div>
                            <div className="skeleton-text" style={{ width: '80px', height: '32px' }}></div>
                        </div>
                    ))
                ) : (
                    <>
                        <StatCard 
                            title="Total Klien" 
                            value={stats?.total_companies || 0} 
                            icon="business" 
                        />
                        <StatCard 
                            title="Klien Aktif" 
                            value={stats?.active_companies || 0} 
                            icon="verified" 
                        />
                        <StatCard 
                            title="Total Proyek" 
                            value={stats?.total_projects || 0} 
                            icon="account_tree" 
                        />
                        <StatCard 
                            title="Total Lahan" 
                            value={stats?.total_farms || 0} 
                            icon="landscape" 
                        />
                        <StatCard 
                            title="Total Luas (Ha)" 
                            value={stats?.total_area_ha || 0} 
                            icon="map" 
                        />
                        <StatCard 
                            title="Total Pengguna" 
                            value={stats?.total_users || 0} 
                            icon="group" 
                        />
                    </>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 'var(--gutter)' }}>
                {/* Recent Companies Section */}
                <Card title="Daftar Klien (Perusahaan)" actionLabel="Lihat Semua" onAction={() => navigate('/admin/companies')}>
                    <div className="table-container" style={{ margin: '0 -24px -24px -24px', border: 'none', boxShadow: 'none' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nama Perusahaan</th>
                                    <th>Status</th>
                                    <th>Plan</th>
                                    <th>Tgl Daftar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={i}>
                                            <td><div className="skeleton-text" style={{ width: '150px', height: '20px' }}></div></td>
                                            <td><div className="skeleton-text" style={{ width: '80px', height: '24px', borderRadius: '12px' }}></div></td>
                                            <td><div className="skeleton-text" style={{ width: '80px', height: '20px' }}></div></td>
                                            <td><div className="skeleton-text" style={{ width: '100px', height: '20px' }}></div></td>
                                        </tr>
                                    ))
                                ) : (
                                    recentCompanies.length > 0 ? (
                                        recentCompanies.map(company => (
                                            <tr key={company.id}>
                                                <td>{company.name}</td>
                                                <td>
                                                    <span className={`badge badge-${company.is_active ? 'active' : 'expired'}`}>
                                                        {company.is_active ? 'Aktif' : 'Non-Aktif'}
                                                    </span>
                                                </td>
                                                <td style={{ color: 'var(--color-text-muted)' }}>{company.subscription_plan}</td>
                                                <td style={{ color: 'var(--color-text-muted)' }}>{new Date(company.created_at).toLocaleDateString('id-ID')}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '20px' }}>Belum ada perusahaan terdaftar.</td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Sidebar widgets (Quick Actions & Activity) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter)' }}>
                    {/* Activity Feed */}
                    <Card title="Log Aktivitas Terbaru">
                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} aria-busy="true">
                                <div className="skeleton-text" style={{ width: '100%', height: '40px' }}></div>
                                <div className="skeleton-text" style={{ width: '100%', height: '40px' }}></div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-text-main)' }}>domain_add</span>
                                    </div>
                                    <div>
                                        <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--color-text-main)', fontWeight: 600 }}>Perusahaan baru terdaftar.</p>
                                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)' }}>Sistem • 2 jam yang lalu</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-text-main)' }}>group_add</span>
                                    </div>
                                    <div>
                                        <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--color-text-main)', fontWeight: 600 }}>15 user ditambahkan.</p>
                                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)' }}>Agri Nusantara • Kemarin</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <button className="btn btn-ghost w-full" style={{ marginTop: '16px', justifyContent: 'center' }}>
                            Lihat Semua Aktivitas
                        </button>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
