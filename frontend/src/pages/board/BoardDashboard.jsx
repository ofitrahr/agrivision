import { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { MapPin, Maximize2, Users, Coins, Download, Filter } from 'lucide-react';
import StatCard from '../../shared/components/UI/StatCard';
import Card from '../../shared/components/UI/Card';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4'];
const GENDER_COLORS = ['#3b82f6', '#ec4899', '#9ca3af'];

const BoardDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const formatCurrency = (value) => {
        if (!value) return 'Rp 0';
        return `Rp ${value.toLocaleString('id-ID')}`;
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/board/dashboard/summary');
                if (response.data?.success) {
                    setData(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching board data:", error);
            } finally {
                setTimeout(() => setLoading(false), 600);
            }
        };
        fetchDashboardData();
    }, []);

    const { metrics, charts } = data || {};

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Executive Board Dashboard</h1>
                    <p className="page-subtitle">Ringkasan metrik Ekologi, Sosial, dan Ekonomi Perusahaan.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-ghost">
                        <Filter size={16} />
                        Filter
                    </button>
                    <button className="btn btn-primary">
                        <Download size={16} />
                        Unduh Laporan
                    </button>
                </div>
            </div>

            {/* Metrik Utama (Cards) */}
            <div className="stats-grid">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="stat-card" aria-busy="true">
                            <div className="skeleton-text" style={{ width: '40px', height: '14px', marginBottom: '12px' }}></div>
                            <div className="skeleton-text" style={{ width: '80px', height: '32px' }}></div>
                        </div>
                    ))
                ) : (
                    <>
                        <StatCard 
                            title="TOTAL LAHAN AKTIF" 
                            value={metrics?.total_farms || 0} 
                            unit="Lahan"
                            icon={MapPin}
                        />
                        <StatCard 
                            title="LUAS AREA" 
                            value={`${metrics?.total_area_ha || 0} Ha`} 
                            icon={Maximize2}
                        />
                        <StatCard 
                            title="TOTAL PEKERJA" 
                            value={metrics?.total_farmers || 0} 
                            unit="Pekerja"
                            icon={Users}
                        />
                        <StatCard 
                            title="TOTAL KEUNTUNGAN" 
                            value={formatCurrency(metrics?.total_profit)} 
                            icon={Coins}
                        />
                    </>
                )}
            </div>

            {/* Analitik Grafik Ekologi & Sosial */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--gutter)', marginBottom: 'var(--space-lg)' }}>
                
                {/* Chart 1: Ekologi (Distribusi Lahan) */}
                <Card title="Biodiversity (Ekologi)">
                    {loading ? (
                        <div className="skeleton-text" style={{ width: '100%', height: '280px' }}></div>
                    ) : charts?.crop_distribution?.length > 0 ? (
                        <div style={{ height: '280px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={charts.crop_distribution} cx="50%" cy="50%" labelLine={true} 
                                         label={({name, value}) => `${name} (${value}Ha)`}
                                         outerRadius={90} fill="#8884d8" dataKey="value">
                                        {charts.crop_distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${value} Hektar`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Data lahan/tanaman belum tersedia.</p>
                        </div>
                    )}
                </Card>

                {/* Chart 2: Sosial (Demografi Pekerja) */}
                <Card title="Demografi Gender Pekerja (Sosial)">
                    {loading ? (
                        <div className="skeleton-text" style={{ width: '100%', height: '280px' }}></div>
                    ) : charts?.gender_distribution?.length > 0 ? (
                        <div style={{ height: '280px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.gender_distribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-muted)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)', fontSize: 12}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)', fontSize: 12}} />
                                    <Tooltip cursor={{fill: 'var(--color-surface-container-low)'}} contentStyle={{borderRadius: '8px', border: '1px solid var(--color-border-muted)', boxShadow: 'var(--shadow-elevated)'}} />
                                    <Bar dataKey="value" name="Jumlah Orang" radius={[6, 6, 0, 0]}>
                                        {charts.gender_distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Data pekerja belum tersedia.</p>
                        </div>
                    )}
                </Card>

                {/* Chart 3: Sosial (Demografi Usia Pekerja) */}
                <Card title="Demografi Usia Pekerja (Sosial)">
                    {loading ? (
                        <div className="skeleton-text" style={{ width: '100%', height: '280px' }}></div>
                    ) : charts?.age_distribution?.length > 0 ? (
                        <div style={{ height: '280px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.age_distribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-muted)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)', fontSize: 12}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)', fontSize: 12}} />
                                    <Tooltip cursor={{fill: 'var(--color-surface-container-low)'}} contentStyle={{borderRadius: '8px', border: '1px solid var(--color-border-muted)', boxShadow: 'var(--shadow-elevated)'}} />
                                    <Bar dataKey="value" name="Jumlah Orang" radius={[6, 6, 0, 0]}>
                                        {charts.age_distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Data usia pekerja belum tersedia.</p>
                        </div>
                    )}
                </Card>

            </div>

            {/* Grafik Ekonomi */}
            <Card title="Tren Pendapatan & Biaya Bulanan (Ekonomi)" style={{ marginBottom: 'var(--space-xl)' }}>
                {loading ? (
                    <div className="skeleton-text" style={{ width: '100%', height: '320px' }}></div>
                ) : charts?.financial_trends?.length > 0 ? (
                    <div style={{ height: '320px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={charts.financial_trends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-muted)" />
                                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)', fontSize: 12}} />
                                <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} contentStyle={{borderRadius: '8px', border: '1px solid var(--color-border-muted)', boxShadow: 'var(--shadow-elevated)'}} />
                                <Legend wrapperStyle={{ paddingTop: '16px' }} />
                                <Line type="monotone" dataKey="revenue" name="Pendapatan" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="cost" name="Biaya Operasional" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="profit" name="Keuntungan Bersih" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Data keuangan belum tersedia.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default BoardDashboard;
