import React, { useEffect, useState, useContext } from 'react';
import api from '../../shared/api/axios';
import { AuthContext } from '../../features/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Map, FileText, Activity, Shield, Users, Settings, Plus, Folder, Upload, MoreVertical } from 'lucide-react';

const ManagerDashboard = () => {
    const [stats, setStats] = useState(null);
    const [recentFarms, setRecentFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch stats and farms concurrently
                const [statsRes, farmsRes] = await Promise.all([
                    api.get('/manager/dashboard/stats'),
                    api.get('/manager/farms')
                ]);

                if (statsRes.data.success) {
                    setStats(statsRes.data.data);
                }
                
                if (farmsRes.data.success) {
                    // Show up to 5 farms as "Recent"
                    setRecentFarms(farmsRes.data.data.slice(0, 5));
                }
            } catch (error) {
                console.error("Gagal mengambil data dashboard", error);
            } finally {
                // Simulate network delay for skeleton
                setTimeout(() => setLoading(false), 800);
            }
        };
        fetchData();
    }, []);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard Manajer</h1>
                    <p className="page-description">Ringkasan operasional dan data perusahaan Anda.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="secondary-btn" onClick={() => navigate('/manager/profile')}>
                        <Settings size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Pengaturan
                    </button>
                    <button className="primary-btn" onClick={() => navigate('/manager/gis')}>
                        <Plus size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Buat Lahan
                    </button>
                </div>
            </div>
            
            {/* Overview Cards */}
            <div className="grid-cards">
                <div className="stat-card">
                    <h3>Total Lahan</h3>
                    {loading ? (
                        <div className="skeleton-text" style={{ width: '60px', height: '40px', marginTop: '12px' }}></div>
                    ) : (
                        <p className="stat-value">{stats?.total_farms || 0}</p>
                    )}
                </div>
                <div className="stat-card">
                    <h3>Total Petani</h3>
                    {loading ? (
                        <div className="skeleton-text" style={{ width: '60px', height: '40px', marginTop: '12px' }}></div>
                    ) : (
                        <p className="stat-value">{stats?.total_farmers || 0}</p>
                    )}
                </div>
                <div className="stat-card">
                    <h3>Total Produksi (Ton)</h3>
                    {loading ? (
                        <div className="skeleton-text" style={{ width: '80px', height: '40px', marginTop: '12px' }}></div>
                    ) : (
                        <p className="stat-value">1,245</p>
                    )}
                </div>
                <div className="stat-card">
                    <h3>Pendapatan Bulan Ini</h3>
                    {loading ? (
                        <div className="skeleton-text" style={{ width: '120px', height: '40px', marginTop: '12px' }}></div>
                    ) : (
                        <p className="stat-value">Rp 450M</p>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                {/* Recent Projects Section */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '20px', margin: 0, fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>Daftar Lahan Terdaftar</h2>
                        <button className="action-btn view-btn" onClick={() => navigate('/manager/gis')} style={{ background: 'transparent', color: 'var(--primary)' }}>Lihat Peta Lahan</button>
                    </div>
                    
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nama Lahan</th>
                                    <th>Jenis Tanaman</th>
                                    <th>Luas Area (ha)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={i}>
                                            <td><div className="skeleton-text" style={{ width: '150px', height: '20px' }}></div></td>
                                            <td><div className="skeleton-text" style={{ width: '100px', height: '20px' }}></div></td>
                                            <td><div className="skeleton-text" style={{ width: '60px', height: '20px' }}></div></td>
                                        </tr>
                                    ))
                                ) : (
                                    recentFarms.length > 0 ? (
                                        recentFarms.map(farm => (
                                            <tr key={farm.id}>
                                                <td style={{ fontWeight: 500 }}>{farm.name}</td>
                                                <td style={{ color: 'var(--text-muted)' }}>{farm.crop_variety || '-'}</td>
                                                <td>{farm.total_area_ha} ha</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Belum ada lahan terdaftar.</td>
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
                        <h2 style={{ fontSize: '16px', margin: '0 0 16px 0', color: 'var(--text-main)' }}>Aktivitas Terkini</h2>
                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="skeleton-text" style={{ width: '100%', height: '40px' }}></div>
                                <div className="skeleton-text" style={{ width: '100%', height: '40px' }}></div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Map size={14} color="var(--text-main)" />
                                    </div>
                                    <div>
                                        <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-main)' }}>Peta lahan baru ditambahkan.</p>
                                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Oleh Budi • 1 jam yang lalu</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FileText size={14} color="var(--text-main)" />
                                    </div>
                                    <div>
                                        <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-main)' }}>Laporan panen Q2 selesai.</p>
                                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Oleh Andi • Kemarin</p>
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

export default ManagerDashboard;
