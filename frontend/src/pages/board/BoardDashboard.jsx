import React, { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import StatCard from '../../shared/components/UI/StatCard';
import Card from '../../shared/components/UI/Card';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const GENDER_COLORS = ['#3b82f6', '#ec4899', '#9ca3af'];

const BoardDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const formatCurrency = (value) => {
        if (!value) return 'Rp 0';
        return `Rp ${value.toLocaleString('id-ID')}`;
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/board/dashboard/summary');
                if (response.data.success) {
                    setData(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching board data:", error);
            } finally {
                // Simulate network delay for skeleton loading
                setTimeout(() => setLoading(false), 800);
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
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>filter_list</span>
                        Filter
                    </button>
                    <button className="btn btn-primary">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
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
                            title="Total Lahan Aktif" 
                            value={metrics?.total_farms || 0} 
                            icon="map" 
                        />
                        <StatCard 
                            title="Luas Area (Ha)" 
                            value={metrics?.total_area_ha || 0} 
                            icon="eco" 
                        />
                        <StatCard 
                            title="Total Pekerja" 
                            value={metrics?.total_farmers || 0} 
                            icon="group" 
                        />
                        <StatCard 
                            title="Total Keuntungan" 
                            value={formatCurrency(metrics?.total_profit)} 
                            icon="payments" 
                            iconColor="var(--color-main-gold)"
                        />
                    </>
                )}
            </div>

            {/* Analitik Grafik Ekologi & Sosial */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--gutter)', marginBottom: 'var(--space-lg)' }}>
                
                {/* Chart 1: Ekologi (Distribusi Lahan) */}
                <Card title="Biodiversity (Ekologi)">
                    {loading ? (
                        <div className="skeleton-text" style={{ width: '100%', height: '300px' }}></div>
                    ) : charts?.crop_distribution?.length > 0 ? (
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={charts.crop_distribution} cx="50%" cy="50%" labelLine={true} 
                                         label={({name, value}) => `${name} (${value}Ha)`}
                                         outerRadius={100} fill="#8884d8" dataKey="value">
                                        {charts.crop_distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${value} Hektar`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <p style={{ color: 'var(--color-text-muted)' }}>Data lahan/tanaman belum tersedia.</p>
                        </div>
                    )}
                </Card>

                {/* Chart 2: Sosial (Demografi Pekerja) */}
                <Card title="Demografi Gender Pekerja (Sosial)">
                    {loading ? (
                        <div className="skeleton-text" style={{ width: '100%', height: '300px' }}></div>
                    ) : charts?.gender_distribution?.length > 0 ? (
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.gender_distribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-muted)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)'}} />
                                    <Tooltip cursor={{fill: 'var(--color-surface-container-low)'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-elevated)'}} />
                                    <Bar dataKey="value" name="Jumlah Orang" radius={[4, 4, 0, 0]}>
                                        {charts.gender_distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <p style={{ color: 'var(--color-text-muted)' }}>Data pekerja belum tersedia.</p>
                        </div>
                    )}
                </Card>

                {/* Chart 3: Sosial (Demografi Usia Pekerja) */}
                <Card title="Demografi Usia Pekerja (Sosial)">
                    {loading ? (
                        <div className="skeleton-text" style={{ width: '100%', height: '300px' }}></div>
                    ) : charts?.age_distribution?.length > 0 ? (
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.age_distribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-muted)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)'}} />
                                    <Tooltip cursor={{fill: 'var(--color-surface-container-low)'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-elevated)'}} />
                                    <Bar dataKey="value" name="Jumlah Orang" radius={[4, 4, 0, 0]}>
                                        {charts.age_distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <p style={{ color: 'var(--color-text-muted)' }}>Data usia pekerja belum tersedia.</p>
                        </div>
                    )}
                </Card>

            </div>

            {/* Grafik Ekonomi */}
            <Card title="Tren Pendapatan & Biaya Bulanan (Ekonomi)" style={{ marginBottom: 'var(--space-xl)' }}>
                {loading ? (
                    <div className="skeleton-text" style={{ width: '100%', height: '350px' }}></div>
                ) : charts?.financial_trends?.length > 0 ? (
                    <div style={{ height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={charts.financial_trends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-muted)" />
                                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)'}} />
                                <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-elevated)'}} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Line type="monotone" dataKey="revenue" name="Pendapatan" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="cost" name="Biaya Operasional" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="profit" name="Keuntungan Bersih" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ color: 'var(--color-text-muted)' }}>Data keuangan belum tersedia.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default BoardDashboard;
