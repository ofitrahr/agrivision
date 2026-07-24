import React, { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const GENDER_COLORS = ['#3b82f6', '#ec4899', '#9ca3af'];

const BoardDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/board/dashboard/summary');
                if (response.data.success) {
                    setData(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching board data:", error);
                alert("Gagal memuat data dashboard.");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}><h2>Memuat Analytics...</h2></div>;
    if (!data) return <div style={{ padding: '50px', textAlign: 'center' }}><h2>Gagal memuat data.</h2></div>;

    const { metrics, charts } = data;

    return (
        <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ color: '#1B4332', margin: 0 }}>Executive Board Dashboard</h1>
                    <p style={{ color: '#6b7280', margin: '5px 0 0 0' }}>Ringkasan metrik Ekologi dan Sosial Perusahaan</p>
                </div>
                <button onClick={handleLogout} style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    Logout
                </button>
            </div>

            {/* Metrik Utama (Cards) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderLeft: '4px solid #10b981' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: '14px', textTransform: 'uppercase' }}>Total Lahan Utama</h3>
                    <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>{metrics.total_farms}</p>
                </div>
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderLeft: '4px solid #3b82f6' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: '14px', textTransform: 'uppercase' }}>Total Luas Area (Ha)</h3>
                    <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>{metrics.total_area_ha}</p>
                </div>
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderLeft: '4px solid #f59e0b' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: '14px', textTransform: 'uppercase' }}>Total Pekerja / Petani</h3>
                    <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>{metrics.total_farmers}</p>
                </div>
            </div>

            {/* Analitik Grafik */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
                
                {/* Chart 1: Ekologi (Distribusi Lahan) */}
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <h3 style={{ margin: '0 0 20px 0', color: '#374151' }}>Ekologi: Distribusi Komoditas (Hektar)</h3>
                    {charts.crop_distribution.length > 0 ? (
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
                        <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '100px' }}>Data lahan/tanaman belum tersedia.</p>
                    )}
                </div>

                {/* Chart 2: Sosial (Demografi Pekerja) */}
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <h3 style={{ margin: '0 0 20px 0', color: '#374151' }}>Sosial: Demografi Gender Pekerja</h3>
                    {charts.gender_distribution.length > 0 ? (
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.gender_distribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" name="Jumlah Orang">
                                        {charts.gender_distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '100px' }}>Data pekerja belum tersedia.</p>
                    )}
                </div>

            </div>
        </div>
    );
};

export default BoardDashboard;
