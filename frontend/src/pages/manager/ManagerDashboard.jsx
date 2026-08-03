import React, { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';
import { Map, FileText, Activity, Settings, LayoutDashboard } from 'lucide-react';

// --- Presentational Components ---

const StatCardSkeleton = () => (
    <div className="stat-card" aria-busy="true">
        <div className="skeleton-text mb-2" style={{ height: '14px', width: '50%' }}></div>
        <div className="skeleton-text mt-3" style={{ height: '32px', width: '80%' }}></div>
    </div>
);

const StatCard = ({ title, value }) => (
    <div className="stat-card">
        <h3>{title}</h3>
        <p className="stat-value">{value}</p>
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
            <div className="flex items-center justify-center bg-subtle w-full" style={{ height: '200px' }} aria-busy="true">
                <div className="skeleton-text w-full" style={{ height: '100%' }}></div>
            </div>
        );
    }
    
    return (
        <div className="w-full overflow-hidden" style={{ height: '200px' }}>
            <iframe srcDoc={mapHtml} className="w-full border-none" style={{ height: '100%', pointerEvents: 'none' }} title="Peta Lahan" tabIndex={-1} />
        </div>
    );
};

const FarmCardSkeleton = () => (
    <div className="farm-card" aria-busy="true">
        <div className="skeleton-text w-full" style={{ height: '200px' }}></div>
        <div className="p-4 flex-col gap-3">
            <div className="skeleton-text mb-1" style={{ height: '24px', width: '70%' }}></div>
            <div className="skeleton-text mb-4" style={{ height: '16px', width: '40%' }}></div>
            
            <div className="skeleton-text mb-1" style={{ height: '14px', width: '50%' }}></div>
            <div className="skeleton-text mb-3" style={{ height: '14px', width: '80%' }}></div>
            
            <div className="flex gap-2 mt-2">
                <div className="skeleton-text rounded-full w-full" style={{ height: '36px' }}></div>
                <div className="skeleton-text rounded-full w-full" style={{ height: '36px' }}></div>
            </div>
        </div>
    </div>
);

const FarmCard = ({ farm, onManage, onAgronomy }) => (
    <div className="farm-card flex-col">
        <FarmMapThumbnail farmId={farm.id} />
        <div className="p-4 flex-col gap-3" style={{ flex: 1 }}>
            <div>
                <h3 className="text-lg font-semibold text-main m-0">{farm.name}</h3>
                <span className="flex items-center gap-1 text-sm text-muted mt-1">
                    <Map size={14}/> {farm.total_area_ha} Ha
                </span>
            </div>
            
            <div className="text-sm">
                <div className="font-semibold text-main mb-1">Tanaman:</div>
                <div className="text-muted">
                    {farm.crops && farm.crops.length > 0 ? farm.crops.join(', ') : 'Belum diatur'}
                </div>
            </div>
            
            <div className="text-sm mb-2">
                <div className="font-semibold text-main mb-1">Penanggung Jawab:</div>
                <div className="text-muted">
                    {farm.farmers && farm.farmers.length > 0 ? farm.farmers.join(', ') : 'Belum ditugaskan'}
                </div>
            </div>
            
            <div className="flex gap-2 mt-auto">
                <button 
                    className="secondary-btn w-full flex items-center justify-center gap-1 text-xs" 
                    onClick={() => onManage(farm.id)}
                    aria-label={`Kelola lahan ${farm.name}`}
                >
                    <Settings size={14} /> Kelola Lahan
                </button>
                <button 
                    className="primary-btn w-full flex items-center justify-center gap-1 text-xs" 
                    onClick={() => onAgronomy(farm.id)}
                    aria-label={`Lihat agronomi lahan ${farm.name}`}
                >
                    <Activity size={14} /> Lihat Agronomi
                </button>
            </div>
        </div>
    </div>
);

const ActivityItem = ({ icon: Icon, text, subtext }) => (
    <div className="flex gap-3 items-center">
        <div className="icon-box">
            <Icon size={16} />
        </div>
        <div>
            <p className="text-sm font-semibold text-main m-0">{text}</p>
            <p className="text-xs text-muted mt-1 m-0">{subtext}</p>
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

    const formatCurrency = (value) => {
        if (value === undefined || value === null) return 'Rp 0';
        return `Rp ${value.toLocaleString('id-ID')}`;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const [statsRes, farmsRes] = await Promise.all([
                    api.get('/manager/dashboard/stats'),
                    api.get('/manager/farms')
                ]);

                if (statsRes.data.success) {
                    setStats(statsRes.data.data);
                }
                if (farmsRes.data.success) {
                    setRecentFarms(farmsRes.data.data.slice(0, 5));
                }
            } catch (err) {
                console.error("Gagal mengambil data dashboard", err);
                setError("Gagal memuat data dashboard. Silakan coba lagi.");
            } finally {
                // Simulate slight delay for skeleton presentation as previously intended
                setTimeout(() => setLoading(false), 500);
            }
        };
        
        fetchData();
    }, []);

    const handleManageFarm = (id) => navigate(`/manager/farm-management?farm_id=${id}`);
    const handleAgronomy = (id) => navigate(`/manager/agronomy?farm_id=${id}`);

    if (error) {
        return (
            <div className="p-10 text-center flex-col items-center justify-center gap-4 bg-surface rounded-2xl border w-full mt-4">
                <div className="icon-box bg-subtle mx-auto" style={{ width: '48px', height: '48px' }}>
                    <LayoutDashboard size={24} className="text-muted" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-main mb-2">Terjadi Kesalahan</h2>
                    <p className="text-sm text-muted">{error}</p>
                </div>
                <button className="primary-btn mt-4" onClick={() => window.location.reload()}>
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
                    <p className="page-description">Ringkasan operasional dan data perusahaan Anda.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        className="secondary-btn flex items-center justify-center gap-2" 
                        onClick={() => navigate('/manager/profile')}
                        aria-label="Pengaturan Profil"
                    >
                        <Settings size={16} /> Pengaturan
                    </button>
                </div>
            </header>
            
            {/* Overview Stats */}
            <section aria-label="Statistik Utama" className="grid-cards mb-8">
                {loading ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    <>
                        <StatCard title="Total Lahan" value={stats?.total_farms || 0} />
                        <StatCard title="Total Petani" value={stats?.total_farmers || 0} />
                        <StatCard title="Total Produksi (Ton)" value={stats?.total_production_ton || 0} />
                        <StatCard title="Total Pendapatan" value={formatCurrency(stats?.total_revenue)} />
                    </>
                )}
            </section>

            <div className="dashboard-layout">
                {/* Recent Projects Section */}
                <section aria-label="Daftar Lahan Perusahaan">
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-xl font-semibold text-main m-0" style={{ fontFamily: 'var(--font-display)' }}>
                            Daftar Lahan Perusahaan
                        </h2>
                    </div>
                    
                    <div className="farm-grid">
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
                            <div className="p-10 text-center bg-subtle rounded-xl border" style={{ gridColumn: '1 / -1' }}>
                                <LayoutDashboard size={32} className="text-muted mx-auto mb-3" />
                                <p className="text-main font-semibold mb-1">Belum ada lahan terdaftar</p>
                                <p className="text-sm text-muted">Lahan yang Anda kelola akan muncul di sini.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Sidebar Widgets */}
                <aside aria-label="Widget Sampingan" className="flex-col gap-8">
                    <div className="activity-feed">
                        <h2 className="text-base font-semibold text-main mt-0 mb-4">Aktivitas Terkini</h2>
                        
                        {loading ? (
                            <div className="flex-col gap-4" aria-busy="true">
                                <div className="skeleton-text w-full" style={{ height: '40px' }}></div>
                                <div className="skeleton-text w-full" style={{ height: '40px' }}></div>
                            </div>
                        ) : (
                            <div className="flex-col gap-4">
                                <ActivityItem 
                                    icon={Map} 
                                    text="Peta lahan baru ditambahkan." 
                                    subtext="Oleh Budi • 1 jam yang lalu" 
                                />
                                <ActivityItem 
                                    icon={FileText} 
                                    text="Laporan panen Q2 selesai." 
                                    subtext="Oleh Andi • Kemarin" 
                                />
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default ManagerDashboard;
