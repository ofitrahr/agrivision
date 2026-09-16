import { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';
import { Building2, ShieldCheck, Layers, MapPin, Maximize2, Users } from 'lucide-react';
import StatCard from '../../shared/components/UI/StatCard';
import Card from '../../shared/components/UI/Card';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [recentCompanies, setRecentCompanies] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, companiesRes, activitiesRes] = await Promise.allSettled([
                    api.get('/admin/dashboard/stats'),
                    api.get('/admin/companies'),
                    api.get('/admin/activities')
                ]);

                if (statsRes.status === 'fulfilled' && statsRes.value?.data?.success) {
                    setStats(statsRes.value.data.data);
                }
                
                if (companiesRes.status === 'fulfilled' && companiesRes.value?.data?.success) {
                    setRecentCompanies(companiesRes.value.data.data.slice(0, 5));
                }

                if (activitiesRes.status === 'fulfilled' && activitiesRes.value?.data?.success) {
                    setActivities(activitiesRes.value.data.data);
                }
            } catch (error) {
                console.error("Gagal mengambil data dashboard", error);
            } finally {
                setTimeout(() => setLoading(false), 500);
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
                            title="TOTAL KLIEN" 
                            value={stats?.total_companies || 0} 
                            icon={Building2}
                        />
                        <StatCard 
                            title="KLIEN AKTIF" 
                            value={stats?.active_companies || 0} 
                            badgeText="Aktif"
                            badgeType="success"
                            icon={ShieldCheck}
                        />
                        <StatCard 
                            title="TOTAL PROYEK" 
                            value={stats?.total_projects || 0} 
                            icon={Layers}
                        />
                        <StatCard 
                            title="TOTAL LAHAN" 
                            value={stats?.total_farms || 0} 
                            icon={MapPin}
                        />
                        <StatCard 
                            title="TOTAL LUAS" 
                            value={stats?.total_area_ha || 0} 
                            unit="Hektar (Ha)"
                            icon={Maximize2}
                        />
                        <StatCard 
                            title="TOTAL PENGGUNA" 
                            value={stats?.total_users || 0} 
                            icon={Users}
                        />
                    </>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 'var(--gutter)' }}>
                {/* Recent Companies Section */}
                <Card title="Daftar Klien (Perusahaan)" actionLabel="Lihat Semua" onAction={() => navigate('/admin/companies')}>
                    <div className="table-container" style={{ margin: '0 -20px -20px -20px', border: 'none', boxShadow: 'none' }}>
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
                                                <td style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{company.name}</td>
                                                <td>
                                                    <span className={`badge badge-${company.is_active ? 'active' : 'expired'}`}>
                                                        {company.is_active ? 'Aktif' : 'Non-Aktif'}
                                                    </span>
                                                </td>
                                                <td style={{ color: 'var(--color-text-muted)' }}>{company.subscription_plan}</td>
                                                <td style={{ color: 'var(--color-text-muted)' }}>
                                                    {company.created_at ? new Date(company.created_at).toLocaleDateString('id-ID') : '-'}
                                                </td>
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

                {/* Sidebar widgets (Activity) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter)' }}>
                    <Card title="Log Aktivitas Terbaru">
                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} aria-busy="true">
                                <div className="skeleton-text" style={{ width: '100%', height: '40px' }}></div>
                                <div className="skeleton-text" style={{ width: '100%', height: '40px' }}></div>
                            </div>
                        ) : activities.length === 0 ? (
                            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '12px 0' }}>
                                Belum ada aktivitas tercatat.
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {activities.slice(0, 5).map((act) => (
                                    <div key={act.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-text-muted)' }}>{act.icon || 'history'}</span>
                                        </div>
                                        <div>
                                            <p style={{ margin: '0 0 2px 0', fontSize: '13px', color: 'var(--color-text-main)', fontWeight: 600 }}>{act.text}</p>
                                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)' }}>{act.subtext}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button 
                            className="btn btn-ghost w-full" 
                            style={{ marginTop: '16px', justifyContent: 'center' }}
                            onClick={() => navigate('/admin/activities')}
                        >
                            Lihat Semua Aktivitas
                        </button>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
