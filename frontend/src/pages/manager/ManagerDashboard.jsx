import React, { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../shared/components/UI/StatCard';
import Card from '../../shared/components/UI/Card';

// --- Presentational Components ---

const StatCardSkeleton = () => (
    <div className="stat-card" aria-busy="true">
        <div className="skeleton-text mb-2" style={{ height: '14px', width: '50%' }}></div>
        <div className="skeleton-text mt-3" style={{ height: '32px', width: '80%' }}></div>
    </div>
);

const FarmMapThumbnail = ({ farmId }) => {
    const [mapHtml, setMapHtml] = useState('');
    
    useEffect(() => {
        let isMounted = true;
        api.get(`/manager/farms/${farmId}/map?thumbnail=true`)
            .then(res => { if(isMounted && res.data.success) setMapHtml(res.data.data.html); })
            .catch(err => console.error(err));
        return () => { isMounted = false; };
    }, [farmId]);
    
    if(!mapHtml) {
        return (
            <div className="flex items-center justify-center w-full" style={{ height: '200px', background: 'var(--color-surface-container)' }} aria-busy="true">
                <div className="skeleton-text w-full" style={{ height: '100%' }}></div>
            </div>
        );
    }
    
    return (
        <div className="w-full overflow-hidden" style={{ height: '200px' }}>
            <iframe srcDoc={mapHtml} className="w-full border-none" style={{ height: '100%', pointerEvents: 'none', border: 'none' }} title="Peta Lahan" tabIndex={-1} />
        </div>
    );
};

const FarmCardSkeleton = () => (
    <Card>
        <div className="skeleton-text w-full" style={{ height: '200px' }}></div>
        <div className="p-4 flex-col gap-3">
            <div className="skeleton-text mb-1" style={{ height: '24px', width: '70%' }}></div>
            <div className="skeleton-text mb-4" style={{ height: '16px', width: '40%' }}></div>
            
            <div className="skeleton-text mb-1" style={{ height: '14px', width: '50%' }}></div>
            <div className="skeleton-text mb-3" style={{ height: '14px', width: '80%' }}></div>
            
            <div className="flex gap-2 mt-2">
                <div className="skeleton-text w-full" style={{ height: '36px', borderRadius: 'var(--radius-pill)' }}></div>
                <div className="skeleton-text w-full" style={{ height: '36px', borderRadius: 'var(--radius-pill)' }}></div>
            </div>
        </div>
    </Card>
);

const FarmCard = ({ farm, onManage, onAgronomy }) => (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <FarmMapThumbnail farmId={farm.id} />
        <div style={{ padding: 'var(--space-md)', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
                <h3 className="card-title" style={{ marginBottom: '4px' }}>{farm.name}</h3>
                <span className="badge badge-stable" style={{ fontSize: '11px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>map</span>
                    {farm.total_area_ha} Ha
                </span>
            </div>
            
            <div style={{ fontSize: '13px' }}>
                <div style={{ fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '2px' }}>Tanaman:</div>
                <div style={{ color: 'var(--color-text-muted)' }}>
                    {farm.crops && farm.crops.length > 0 ? farm.crops.join(', ') : 'Belum diatur'}
                </div>
            </div>
            
            <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                <div style={{ fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '2px' }}>Penanggung Jawab:</div>
                <div style={{ color: 'var(--color-text-muted)' }}>
                    {farm.farmers && farm.farmers.length > 0 ? farm.farmers.join(', ') : 'Belum ditugaskan'}
                </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <button 
                    className="btn btn-ghost btn-sm" 
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => onManage(farm.id)}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>settings</span> 
                    Kelola
                </button>
                <button 
                    className="btn btn-primary btn-sm" 
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => onAgronomy(farm.id)}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>eco</span> 
                    Agronomi
                </button>
            </div>
        </div>
    </div>
);

const ActivityItem = ({ icon, text, subtext }) => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-container)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
        </div>
        <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-main)', margin: 0 }}>{text}</p>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>{subtext}</p>
        </div>
    </div>
);

// --- Container Component ---

const ManagerDashboard = () => {
    const [stats, setStats] = useState(null);
    const [recentFarms, setRecentFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const [activities, setActivities] = useState([]);

    const formatCurrency = (value) => {
        if (value === undefined || value === null) return 'Rp 0';
        return `Rp ${value.toLocaleString('id-ID')}`;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const [statsRes, farmsRes, activitiesRes] = await Promise.allSettled([
                    api.get('/manager/dashboard/stats'),
                    api.get('/manager/farms'),
                    api.get('/manager/activities')
                ]);

                if (statsRes.status === 'fulfilled' && statsRes.value?.data?.success) {
                    setStats(statsRes.value.data.data);
                }
                if (farmsRes.status === 'fulfilled' && farmsRes.value?.data?.success) {
                    setRecentFarms(farmsRes.value.data.data.slice(0, 5));
                }
                if (activitiesRes.status === 'fulfilled' && activitiesRes.value?.data?.success) {
                    setActivities(activitiesRes.value.data.data);
                }
            } catch (err) {
                console.error("Gagal mengambil data dashboard", err);
            } finally {
                setTimeout(() => setLoading(false), 500);
            }
        };
        
        fetchData();
    }, []);

    const handleManageFarm = (id) => navigate(`/manager/farm-management?farm_id=${id}`);
    const handleAgronomy = (id) => navigate(`/manager/agronomy?farm_id=${id}`);

    if (error) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-error)', marginBottom: '16px' }}>error</span>
                <h2 className="text-headline-lg" style={{ marginBottom: '8px' }}>Terjadi Kesalahan</h2>
                <p className="text-body-md" style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>{error}</p>
                <button className="btn btn-primary" onClick={() => window.location.reload()}>
                    Muat Ulang
                </button>
            </div>
        );
    }

    return (
        <div>
            <header className="page-header">
                <div>
                    <h1 className="page-title">Dashboard Manajer</h1>
                    <p className="page-subtitle">Ringkasan operasional dan data perusahaan Anda.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        className="btn btn-ghost" 
                        onClick={() => navigate('/manager/profile')}    
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>settings</span> 
                        Pengaturan
                    </button>
                </div>
            </header>
            
            {/* Overview Stats */}
            <section aria-label="Statistik Utama" className="stats-grid">
                {loading ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    <>
                        <StatCard 
                            title="Total Lahan" 
                            value={stats?.total_farms || 0} 
                            icon="landscape" 
                        />
                        <StatCard 
                            title="Total Petani" 
                            value={stats?.total_farmers || 0} 
                            icon="group" 
                        />
                        <StatCard 
                            title="Total Produksi (Ton)" 
                            value={stats?.total_production_ton || 0} 
                            icon="eco" 
                        />
                        <StatCard 
                            title="Total Pendapatan" 
                            value={formatCurrency(stats?.total_revenue)} 
                            icon="payments" 
                            iconColor="var(--color-main-gold)"
                        />
                    </>
                )}
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 'var(--gutter)' }}>
                {/* Recent Projects Section */}
                <section aria-label="Daftar Lahan Project">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                        <h2 className="text-headline-lg" style={{ fontSize: '20px', margin: 0 }}>Daftar Lahan Perusahaan</h2>
                    </div>
                    
                    <div className="stats-grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                        {loading ? (
                            <>
                                <FarmCardSkeleton />
                                <FarmCardSkeleton />
                            </>
                        ) : recentFarms.length > 0 ? (
                            recentFarms.map(farm => (
                                <FarmCard 
                                    key={farm.id} 
                                    farm={farm} 
                                    onManage={handleManageFarm}
                                    onAgronomy={handleAgronomy}
                                />
                            ))
                        ) : (
                            <Card style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>landscape</span>
                                <p style={{ fontWeight: 600, color: 'var(--color-text-main)', margin: '0 0 4px 0' }}>Belum ada lahan terdaftar</p>
                                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>Lahan yang Anda kelola akan muncul di sini.</p>
                            </Card>
                        )}
                    </div>
                </section>

                {/* Sidebar Widgets */}
                <aside aria-label="Widget Sampingan">
                    <Card title="Aktivitas Terkini">
                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} aria-busy="true">
                                <div className="skeleton-text w-full" style={{ height: '40px' }}></div>
                                <div className="skeleton-text w-full" style={{ height: '40px' }}></div>
                            </div>
                        ) : activities.length === 0 ? (
                            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '12px 0' }}>
                                Belum ada aktivitas tercatat.
                            </p>
                        ) : (
                            <div>
                                {activities.slice(0,5).map((act) => (
                                    <ActivityItem
                                        key={act.id}
                                        icon={act.icon}
                                        text={act.text}
                                        subtext={act.subtext}
                                    />
                                ))}
                            </div>
                        )}
                        <button 
                            className="btn btn-ghost w-full" 
                            style={{ marginTop: '8px', justifyContent: 'center' }}
                            onClick={() => navigate('/manager/activities')}
                        >
                            Lihat Semua Aktivitas
                        </button>
                    </Card>
                </aside>
            </div>
        </div>
    );
};

export default ManagerDashboard;
