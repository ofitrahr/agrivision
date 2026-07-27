import React, { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';
import { Users, Building, Map, Activity, Plus, Settings, MoreVertical } from 'lucide-react';

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
                    <p className="page-description">Ringkasan sistem dan perusahaan yang terdaftar.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="secondary-btn" onClick={() => navigate('/admin/companies')}>
                        <Settings size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Kelola Sistem
                    </button>
                    <button className="primary-btn" onClick={() => navigate('/admin/companies')}>
                        <Plus size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Tambah Perusahaan
                    </button>
                </div>
            </div>
            
            {/* Overview Cards */}
            <div className="grid-cards">
                <div className="stat-card">
                    <h3>Total Company</h3>
                    {loading ? (
                        <div className="skeleton-text" style={{ width: '60px', height: '40px', marginTop: '12px' }}></div>
                    ) : (
                        <p className="stat-value">{stats?.total_companies || 0}</p>
                    )}
                </div>
                <div className="stat-card">
                    <h3>Active Company</h3>
                    {loading ? (
                        <div className="skeleton-text" style={{ width: '60px', height: '40px', marginTop: '12px' }}></div>
                    ) : (
                        <p className="stat-value">{stats?.active_companies || 0}</p>
                    )}
                </div>
                <div className="stat-card">
                    <h3>Total Lahan (Farms)</h3>
                    {loading ? (
                        <div className="skeleton-text" style={{ width: '60px', height: '40px', marginTop: '12px' }}></div>
                    ) : (
                        <p className="stat-value">{stats?.total_farms || 0}</p>
                    )}
                </div>
                <div className="stat-card">
                    <h3>Total Pengguna</h3>
                    {loading ? (
                        <div className="skeleton-text" style={{ width: '60px', height: '40px', marginTop: '12px' }}></div>
                    ) : (
                        <p className="stat-value">{stats?.total_users || 0}</p>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                {/* Recent Companies Section */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '20px', margin: 0, fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>Perusahaan Terbaru</h2>
                        <button className="action-btn view-btn" onClick={() => navigate('/admin/companies')} style={{ background: 'transparent', color: 'var(--primary)' }}>Lihat Semua</button>
                    </div>
                    
                    <div className="table-container">
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
                                                <td style={{ fontWeight: 500 }}>{company.name}</td>
                                                <td>
                                                    <span className={`badge ${company.is_active ? 'badge-success' : 'badge-neutral'}`}>
                                                        {company.is_active ? 'Aktif' : 'Non-Aktif'}
                                                    </span>
                                                </td>
                                                <td style={{ color: 'var(--text-muted)' }}>{company.subscription_plan}</td>
                                                <td style={{ color: 'var(--text-muted)' }}>{new Date(company.created_at).toLocaleDateString('id-ID')}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Belum ada perusahaan terdaftar.</td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar widgets (Quick Actions & Activity) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>


                    {/* Activity Feed */}
                    <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-muted)', boxShadow: 'var(--shadow-sm)' }}>
                        <h2 style={{ fontSize: '16px', margin: '0 0 16px 0', color: 'var(--text-main)' }}>Aktivitas Sistem</h2>
                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="skeleton-text" style={{ width: '100%', height: '40px' }}></div>
                                <div className="skeleton-text" style={{ width: '100%', height: '40px' }}></div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Building size={14} color="var(--text-main)" />
                                    </div>
                                    <div>
                                        <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-main)' }}>Perusahaan baru terdaftar.</p>
                                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Sistem • 2 jam yang lalu</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Users size={14} color="var(--text-main)" />
                                    </div>
                                    <div>
                                        <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-main)' }}>15 user ditambahkan.</p>
                                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Agri Nusantara • Kemarin</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
