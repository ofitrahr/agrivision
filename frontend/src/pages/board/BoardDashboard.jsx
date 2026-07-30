import React, { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { Leaf, Users, Map, DollarSign, Download, Filter } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const GENDER_COLORS = ['#ec4899', '#3b82f6', '#9ca3af'];

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
                    <p className="page-description">Ringkasan metrik Ekologi, Sosial, dan Ekonomi Perusahaan.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="secondary-btn">
                        <Filter size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Filter
                    </button>
                    <button className="primary-btn">
                        <Download size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Unduh Laporan
                    </button>
                </div>
            </div>

            {/* Metrik Utama (Cards) */}
            <div className="grid-cards">
                <div className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3>Total Lahan Aktif</h3>
                        <Map size={20} color="var(--primary)" />
                    </div>
                    {loading ? (
                        <div className="skeleton-text" style={{ width: '60px', height: '40px', marginTop: '12px' }}></div>
                    ) : (
                        <p className="stat-value">{metrics?.total_farms || 0}</p>
                    )}
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3>Luas Area (Ha)</h3>
                        <Leaf size={20} color="var(--primary)" />
                    </div>
                    {loading ? (
                        <div className="skeleton-text" style={{ width: '80px', height: '40px', marginTop: '12px' }}></div>
                    ) : (
                        <p className="stat-value">{metrics?.total_area_ha || 0}</p>
                    )}
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3>Total Pekerja</h3>
                        <Users size={20} color="var(--primary)" />
                    </div>
                    {loading ? (
                        <div className="skeleton-text" style={{ width: '60px', height: '40px', marginTop: '12px' }}></div>
                    ) : (
                        <p className="stat-value">{metrics?.total_farmers || 0}</p>
                    )}
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3>Total Keuntungan</h3>
                        <DollarSign size={20} color="var(--primary)" />
                    </div>
                    {loading ? (
                        <div className="skeleton-text" style={{ width: '120px', height: '40px', marginTop: '12px' }}></div>
                    ) : (
                        <p className="stat-value">{formatCurrency(metrics?.total_profit)}</p>
                    )}
                </div>
            </div>

            {/* Analitik Grafik Ekologi & Sosial */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px', marginBottom: '32px' }}>
                
                {/* Chart 1: Ekologi (Distribusi Lahan) */}
                <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-muted)', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ fontSize: '18px', margin: '0 0 20px 0', fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>Biodiversity (Ekologi)</h3>
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
                            <p style={{ color: 'var(--text-muted)' }}>Data lahan/tanaman belum tersedia.</p>
                        </div>
                    )}
                </div>

                {/* Chart 2: Sosial (Demografi Pekerja) */}
                <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-muted)', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ fontSize: '18px', margin: '0 0 20px 0', fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>Demografi Gender Pekerja (Sosial)</h3>
                    {loading ? (
                        <div className="skeleton-text" style={{ width: '100%', height: '300px' }}></div>
                    ) : charts?.gender_distribution?.length > 0 ? (
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.gender_distribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-muted)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} />
                                    <Tooltip cursor={{fill: 'var(--surface-dim)'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-lg)'}} />
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
                            <p style={{ color: 'var(--text-muted)' }}>Data pekerja belum tersedia.</p>
                        </div>
                    )}
                </div>

            </div>

            {/* Grafik Ekonomi */}
            <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-muted)', boxShadow: 'var(--shadow-sm)', marginBottom: '40px' }}>
                <h3 style={{ fontSize: '18px', margin: '0 0 20px 0', fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>Tren Pendapatan & Biaya Bulanan (Ekonomi)</h3>
                {loading ? (
                    <div className="skeleton-text" style={{ width: '100%', height: '350px' }}></div>
                ) : charts?.financial_trends?.length > 0 ? (
                    <div style={{ height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={charts.financial_trends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-muted)" />
                                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)'}} />
                                <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-lg)'}} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Line type="monotone" dataKey="revenue" name="Pendapatan" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="cost" name="Biaya Operasional" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="profit" name="Keuntungan Bersih" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ color: 'var(--text-muted)' }}>Data keuangan belum tersedia.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BoardDashboard;
