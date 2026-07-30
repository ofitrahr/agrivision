import React, { useEffect, useState, useContext } from 'react';
import api from '../../shared/api/axios';
import { AuthContext } from '../../features/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Map, FileText, Activity, Shield, Users, Settings, Plus, Folder, Upload, MoreVertical, LayoutDashboard, Leaf } from 'lucide-react';

const FarmMapThumbnail = ({ farmId }) => {
    const [mapHtml, setMapHtml] = useState('');
    useEffect(() => {
        api.get(`/manager/farms/${farmId}/map?thumbnail=true`)
            .then(res => { if(res.data.success) setMapHtml(res.data.data.html); })
            .catch(err => console.error(err));
    }, [farmId]);
    
    if(!mapHtml) return <div style={{height: '200px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><div className="spinner"></div></div>;
    return (
        <div style={{ height: '200px', overflow: 'hidden' }}>
            <iframe srcDoc={mapHtml} style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }} title="thumbnail" />
        </div>
    );
};

const ManagerDashboard = () => {
    const [stats, setStats] = useState(null);
    const [recentFarms, setRecentFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const formatCurrency = (value) => {
        if (!value) return 'Rp 0';
        return `Rp ${value.toLocaleString('id-ID')}`;
    };

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
                        <p className="stat-value">{stats?.total_production_ton || 0}</p>
                    )}
                </div>
                <div className="stat-card">
                    <h3>Total Pendapatan (Rp)</h3>
                    {loading ? (
                        <div className="skeleton-text" style={{ width: '120px', height: '40px', marginTop: '12px' }}></div>
                    ) : (
                        <p className="stat-value">
                            {formatCurrency(stats?.total_revenue)}
                        </p>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                {/* Recent Projects Section */}
                <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '20px', margin: 0, fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>Daftar Lahan Perusahaan</h2>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {loading ? (
                            Array.from({ length: 2 }).map((_, i) => (
                                <div key={i} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', height: '300px' }}></div>
                            ))
                        ) : recentFarms.length > 0 ? (
                            recentFarms.map(farm => (
                                <div key={farm.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                    <FarmMapThumbnail farmId={farm.id} />
                                    <div style={{ padding: '15px' }}>
                                        <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#111827' }}>{farm.name}</h3>
                                        <div style={{ display: 'flex', gap: '15px', marginBottom: '8px', color: '#6b7280', fontSize: '14px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <Map size={14}/> {farm.total_area_ha} Ha
                                            </span>
                                        </div>
                                        <div style={{ marginBottom: '8px', fontSize: '13px' }}>
                                            <div style={{ fontWeight: '600', color: '#374151', marginBottom: '3px' }}>Tanaman:</div>
                                            <div style={{ color: '#4b5563' }}>
                                                {farm.crops && farm.crops.length > 0 ? farm.crops.join(', ') : 'Belum diatur'}
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: '15px', fontSize: '13px' }}>
                                            <div style={{ fontWeight: '600', color: '#374151', marginBottom: '3px' }}>Penanggung Jawab:</div>
                                            <div style={{ color: '#4b5563' }}>
                                                {farm.farmers && farm.farmers.length > 0 ? farm.farmers.join(', ') : 'Belum ditugaskan'}
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <button 
                                                className="secondary-btn" 
                                                style={{ width: '100%', justifyContent: 'center', fontSize: '13px' }}
                                                onClick={() => navigate(`/manager/farm-management?farm_id=${farm.id}`)}
                                            >
                                                <Settings size={14} style={{ marginRight: '5px' }} />
                                                Kelola Lahan
                                            </button>
                                            <button 
                                                className="primary-btn" 
                                                style={{ width: '100%', justifyContent: 'center', fontSize: '13px' }}
                                                onClick={() => navigate(`/manager/agronomy?farm_id=${farm.id}`)}
                                            >
                                                <Activity size={14} style={{ marginRight: '5px' }} />
                                                Lihat Agronomi
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', background: '#f9fafb', borderRadius: '12px', color: '#6b7280' }}>
                                <p>Belum ada lahan terdaftar.</p>
                            </div>
                        )}
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
