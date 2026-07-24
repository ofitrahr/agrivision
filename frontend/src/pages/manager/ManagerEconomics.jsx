import React, { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';

const ManagerEconomics = () => {
    const navigate = useNavigate();
    const [farms, setFarms] = useState([]);
    const [selectedFarm, setSelectedFarm] = useState('');
    const [records, setRecords] = useState([]);
    
    // Form state
    const [period, setPeriod] = useState('');
    const [production, setProduction] = useState('');
    const [cost, setCost] = useState('');
    const [revenue, setRevenue] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchFarms();
    }, []);

    const fetchFarms = async () => {
        try {
            const response = await api.get('/manager/farms');
            if (response.data.success) {
                setFarms(response.data.data);
            }
        } catch (error) {
            console.error('Gagal memuat lahan');
        }
    };

    const fetchRecords = async (farmId) => {
        try {
            const response = await api.get(`/manager/farms/${farmId}/financials`);
            if (response.data.success) {
                setRecords(response.data.data);
            }
        } catch (error) {
            console.error('Gagal memuat catatan keuangan');
        }
    };

    const handleFarmChange = (e) => {
        const farmId = e.target.value;
        setSelectedFarm(farmId);
        if (farmId) fetchRecords(farmId);
        else setRecords([]);
    };

    const handleSubmit = async (e) => {
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
                // Reset form
                setPeriod(''); setProduction(''); setCost(''); setRevenue(''); setNotes('');
                // Reload table
                fetchRecords(selectedFarm);
            }
        } catch (error) {
            alert('Gagal menyimpan laporan.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
            <button className="action-btn view-btn" onClick={() => navigate('/manager/dashboard')} style={{ marginBottom: '20px' }}>⬅ Kembali ke Dashboard</button>
            <h1 style={{ color: '#1B4332' }}>Laporan Panen & Keuangan</h1>
            <p style={{ color: '#6b7280', marginBottom: '30px' }}>Kelola laporan produksi dan biaya operasional bulanan per lahan.</p>

            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Pilih Lahan Utama:</label>
                <select value={selectedFarm} onChange={handleFarmChange} style={{ padding: '10px', width: '100%', maxWidth: '400px', borderRadius: '8px', border: '1px solid #ccc' }}>
                    <option value="">-- Pilih Lahan --</option>
                    {farms.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                </select>
            </div>

            {selectedFarm && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
                    {/* Form Input */}
                    <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                        <h3 style={{ marginTop: 0 }}>Input Laporan Baru</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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

                    {/* Riwayat */}
                    <div>
                        <h3 style={{ marginTop: 0 }}>Riwayat Laporan</h3>
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
        </div>
    );
};

export default ManagerEconomics;
