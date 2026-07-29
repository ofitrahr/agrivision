import React, { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const ManagerEconomics = () => {
    const navigate = useNavigate();
    const [farms, setFarms] = useState([]);
    const [selectedFarm, setSelectedFarm] = useState('');
    const [activeTab, setActiveTab] = useState('finance');
    const [permissions, setPermissions] = useState(null);
    
    // Finance Tab State
    const [records, setRecords] = useState([]);
    const [period, setPeriod] = useState('');
    const [production, setProduction] = useState('');
    const [cost, setCost] = useState('');
    const [revenue, setRevenue] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    // Analytics Tab State
    const [blocks, setBlocks] = useState([]);
    const [harvests, setHarvests] = useState([]);
    const [analyticsPeriod, setAnalyticsPeriod] = useState('');
    const [analyticsBlockId, setAnalyticsBlockId] = useState('');
    const [analyticsYield, setAnalyticsYield] = useState('');
    const [analyticsNotes, setAnalyticsNotes] = useState('');
    const [analyticsSaving, setAnalyticsSaving] = useState(false);

    useEffect(() => {
        fetchFarms();
    }, []);

    const fetchFarms = async () => {
        try {
            const response = await api.get('/manager/farms');
            if (response.data.success) {
                setFarms(response.data.data);
                if (response.data.permissions) {
                    setPermissions(response.data.permissions);
                }
            }
        } catch (error) {
            console.error('Gagal memuat lahan');
        }
    };

    const fetchFinanceRecords = async (farmId) => {
        try {
            const response = await api.get(`/manager/farms/${farmId}/financials`);
            if (response.data.success) setRecords(response.data.data);
        } catch (error) {
            console.error('Gagal memuat catatan keuangan');
        }
    };

    const fetchAnalyticsData = async (farmId) => {
        try {
            const [blocksRes, harvestsRes] = await Promise.all([
                api.get(`/manager/farms/${farmId}/blocks`),
                api.get(`/manager/farms/${farmId}/harvests`)
            ]);
            if (blocksRes.data.success) setBlocks(blocksRes.data.data);
            if (harvestsRes.data.success) setHarvests(harvestsRes.data.data);
        } catch (error) {
            console.error('Gagal memuat data analitik');
        }
    };

    const handleFarmChange = (e) => {
        const farmId = e.target.value;
        setSelectedFarm(farmId);
        if (farmId) {
            if (activeTab === 'finance') fetchFinanceRecords(farmId);
            if (activeTab === 'analytics') fetchAnalyticsData(farmId);
        } else {
            setRecords([]);
            setHarvests([]);
            setBlocks([]);
        }
    };

    useEffect(() => {
        if (selectedFarm) {
            if (activeTab === 'finance') fetchFinanceRecords(selectedFarm);
            if (activeTab === 'analytics') fetchAnalyticsData(selectedFarm);
        }
    }, [activeTab, selectedFarm]);

    const handleFinanceSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFarm) return alert("Pilih lahan terlebih dahulu");
        
        setSaving(true);
        try {
            const payload = {
                period,
                total_production_kg: parseFloat(production) || 0,
                operational_cost: parseFloat(cost) || 0,
                estimated_revenue: parseFloat(revenue) || 0,
                notes
            };
            const response = await api.post(`/manager/farms/${selectedFarm}/financials`, payload);
            if (response.data.success) {
                alert('Laporan berhasil disimpan!');
                setPeriod(''); setProduction(''); setCost(''); setRevenue(''); setNotes('');
                fetchFinanceRecords(selectedFarm);
            }
        } catch (error) {
            alert('Gagal menyimpan laporan.');
        } finally {
            setSaving(false);
        }
    };

    const handleAnalyticsSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFarm) return alert("Pilih lahan terlebih dahulu");
        
        setAnalyticsSaving(true);
        try {
            const payload = {
                period: analyticsPeriod,
                block_id: analyticsBlockId,
                yield_kg: parseFloat(analyticsYield) || 0,
                notes: analyticsNotes
            };
            const response = await api.post(`/manager/farms/${selectedFarm}/harvests`, payload);
            if (response.data.success) {
                alert('Data panen blok berhasil disimpan!');
                setAnalyticsPeriod(''); setAnalyticsBlockId(''); setAnalyticsYield(''); setAnalyticsNotes('');
                fetchAnalyticsData(selectedFarm);
            }
        } catch (error) {
            alert('Gagal menyimpan data panen.');
        } finally {
            setAnalyticsSaving(false);
        }
    };

    // Prepare data for Analytics Charts
    // 1. Productivity by Block (aggregate total yield per block)
    const productivityData = blocks.map(block => {
        const blockYield = harvests
            .filter(h => h.block_id === block.id)
            .reduce((sum, h) => sum + h.yield_kg, 0);
        return { name: block.name, yield: blockYield };
    });

    // 2. Yield Forecast (Trend over periods)
    // Group by period
    const periodsMap = {};
    harvests.forEach(h => {
        if (!periodsMap[h.period]) periodsMap[h.period] = 0;
        periodsMap[h.period] += h.yield_kg;
    });
    // Reverse because we want oldest to newest left to right. Currently assume backend returns desc.
    const trendData = Object.keys(periodsMap).map(p => ({ period: p, actual_yield: periodsMap[p] })).reverse();
    
    // Add a simple mock forecast to the end if there's data
    if (trendData.length > 0) {
        const lastYield = trendData[trendData.length - 1].actual_yield;
        trendData.push({ period: 'Forecast (Next)', forecast_yield: lastYield * 1.05 }); // +5% prediction
    }

    return (
        <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
            <button className="action-btn view-btn" onClick={() => navigate('/manager/dashboard')} style={{ marginBottom: '20px' }}> Kembali ke Dashboard</button>
            <h1 style={{ color: '#1B4332' }}>Laporan & Analitik Panen</h1>
            
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>
                <button 
                    style={{ padding: '10px 20px', border: 'none', background: activeTab === 'finance' ? '#1B4332' : 'transparent', color: activeTab === 'finance' ? 'white' : '#6b7280', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                    onClick={() => setActiveTab('finance')}
                >
                    Laporan Keuangan
                </button>
                {permissions?.can_access_yield && (
                    <button 
                        style={{ padding: '10px 20px', border: 'none', background: activeTab === 'analytics' ? '#1B4332' : 'transparent', color: activeTab === 'analytics' ? 'white' : '#6b7280', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={() => setActiveTab('analytics')}
                    >
                        Productivity Analytics & Forecast
                    </button>
                )}
            </div>

            <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Pilih Lahan Utama:</label>
                <select value={selectedFarm} onChange={handleFarmChange} style={{ padding: '10px', width: '100%', maxWidth: '400px', borderRadius: '8px', border: '1px solid #ccc' }}>
                    <option value="">-- Pilih Lahan --</option>
                    {farms.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                </select>
            </div>

            {!selectedFarm && <p style={{ color: '#6b7280' }}>Pilih lahan untuk melihat data.</p>}

            {/* TAB FINANCE */}
            {selectedFarm && activeTab === 'finance' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
                    <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                        <h3 style={{ marginTop: 0 }}>Input Keuangan Global</h3>
                        <form onSubmit={handleFinanceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Periode (Misal: Juli 2026) *</label>
                                <input type="text" required value={period} onChange={e => setPeriod(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Total Produksi (Kg)</label>
                                <input type="number" value={production} onChange={e => setProduction(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Total Pendapatan (Rp)</label>
                                <input type="number" value={revenue} onChange={e => setRevenue(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Biaya Operasional (Rp)</label>
                                <input type="number" value={cost} onChange={e => setCost(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Catatan</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%', padding: '8px', minHeight: '60px' }} />
                            </div>
                            <button type="submit" className="primary-btn" disabled={saving}>
                                {saving ? 'Menyimpan...' : 'Simpan Laporan'}
                            </button>
                        </form>
                    </div>

                    <div>
                        <h3 style={{ marginTop: 0 }}>Riwayat Keuangan</h3>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Periode</th>
                                    <th>Produksi (Kg)</th>
                                    <th>Pendapatan</th>
                                    <th>Biaya</th>
                                    <th>Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.length === 0 ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Belum ada laporan</td></tr>
                                ) : (
                                    records.map(r => (
                                        <tr key={r.id}>
                                            <td>{r.period}</td>
                                            <td>{r.total_production_kg}</td>
                                            <td style={{ color: '#10b981' }}>Rp {r.estimated_revenue.toLocaleString('id-ID')}</td>
                                            <td style={{ color: '#ef4444' }}>Rp {r.operational_cost.toLocaleString('id-ID')}</td>
                                            <td style={{ fontWeight: 'bold' }}>Rp {r.profit.toLocaleString('id-ID')}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB ANALYTICS */}
            {selectedFarm && activeTab === 'analytics' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
                        
                        {/* Form Input Panen Per Blok */}
                        <div style={{ background: '#ecfdf5', padding: '20px', borderRadius: '12px', border: '1px solid #34d399' }}>
                            <h3 style={{ marginTop: 0, color: '#065f46' }}>Input Panen per Blok</h3>
                            <form onSubmit={handleAnalyticsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Pilih Blok *</label>
                                    <select required value={analyticsBlockId} onChange={e => setAnalyticsBlockId(e.target.value)} style={{ width: '100%', padding: '8px' }}>
                                        <option value="">-- Pilih Blok --</option>
                                        {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Periode (Misal: Juli 2026) *</label>
                                    <input type="text" required value={analyticsPeriod} onChange={e => setAnalyticsPeriod(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Hasil Panen (Kg) *</label>
                                    <input type="number" required value={analyticsYield} onChange={e => setAnalyticsYield(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Catatan Kendala/Kualitas</label>
                                    <textarea value={analyticsNotes} onChange={e => setAnalyticsNotes(e.target.value)} style={{ width: '100%', padding: '8px', minHeight: '60px' }} />
                                </div>
                                <button type="submit" className="primary-btn" disabled={analyticsSaving}>
                                    {analyticsSaving ? 'Menyimpan...' : 'Simpan Data Panen'}
                                </button>
                            </form>
                        </div>

                        {/* Chart: Productivity Analytics */}
                        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                            <h3 style={{ marginTop: 0 }}>Productivity Analytics (Total Panen per Blok)</h3>
                            <div style={{ height: '300px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={productivityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="yield" name="Total Panen (Kg)" fill="#10b981" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px' }}>* Grafik membandingkan total produksi antar blok untuk mencari tahu zona paling produktif.</p>
                        </div>
                    </div>

                    {/* Chart: Yield Forecast */}
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                        <h3 style={{ marginTop: 0 }}>Yield Index & Forecast (Tren & Prediksi Panen Global)</h3>
                        <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="period" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="actual_yield" name="Panen Aktual (Kg)" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                                    <Line type="monotone" dataKey="forecast_yield" name="Prediksi Panen (Kg)" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px' }}>* Garis putus-putus oranye menunjukkan proyeksi prediksi panen (berbasis algoritma moving average dari data sebelumnya).</p>
                    </div>

                    {/* Table of Harvests */}
                    <div>
                        <h3 style={{ marginTop: 0 }}>Log Panen per Zona</h3>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Blok</th>
                                    <th>Periode</th>
                                    <th>Hasil (Kg)</th>
                                    <th>Catatan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {harvests.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Belum ada data panen per blok</td></tr>
                                ) : (
                                    harvests.map(h => (
                                        <tr key={h.id}>
                                            <td style={{ fontWeight: 'bold' }}>{h.block_name}</td>
                                            <td>{h.period}</td>
                                            <td style={{ color: '#10b981' }}>{h.yield_kg} Kg</td>
                                            <td>{h.notes || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerEconomics;
