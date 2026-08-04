import React, { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { useNavigate, useLocation } from 'react-router-dom';

const ManagerFarmManagement = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [farmList, setFarmList] = useState([]);
    const [farmId, setFarmId] = useState(null);
    const [farm, setFarm] = useState(null);
    const [allFarmers, setAllFarmers] = useState([]);
    
    // State for the form
    const [selectedFarmerIds, setSelectedFarmerIds] = useState([]);
    const [crops, setCrops] = useState([]);
    const [newCropInput, setNewCropInput] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    
    useEffect(() => {
        initFarms();
    }, [location]);

    const initFarms = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const farmsRes = await api.get('/manager/farms');
            if (farmsRes.data.success) {
                const farmsData = farmsRes.data.data;
                setFarmList(farmsData);

                if (farmsData.length === 0) {
                    setErrorMsg('Belum ada data lahan yang terdaftar di proyek ini.');
                    setLoading(false);
                    return;
                }

                const params = new URLSearchParams(location.search);
                const qFarmId = params.get('farm_id');
                
                const targetId = (qFarmId && farmsData.some(f => f.id === qFarmId))
                    ? qFarmId
                    : farmsData[0].id;

                setFarmId(targetId);
                await fetchData(targetId);
            }
        } catch (error) {
            setErrorMsg('Gagal memuat daftar lahan.');
            setLoading(false);
        }
    };

    const fetchData = async (id) => {
        setLoading(true);
        setErrorMsg('');
        try {
            const [farmRes, farmersRes] = await Promise.all([
                api.get(`/manager/farms/${id}/details`),
                api.get('/manager/farmers')
            ]);
            
            if (farmRes.data.success) {
                const farmData = farmRes.data.data;
                setFarm(farmData);
                setSelectedFarmerIds(farmData.farmers.map(f => f.id));
                setCrops(farmData.crops || []);
            }
            if (farmersRes.data.success) {
                setAllFarmers(farmersRes.data.data);
            }
        } catch (error) {
            setErrorMsg('Gagal memuat data detail lahan.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectFarmChange = (e) => {
        const selectedId = e.target.value;
        setFarmId(selectedId);
        navigate(`/manager/farm-management?farm_id=${selectedId}`, { replace: true });
        fetchData(selectedId);
    };

    const handleAddCrop = (e) => {
        e.preventDefault();
        const trimmed = newCropInput.trim();
        if (trimmed && !crops.includes(trimmed)) {
            setCrops([...crops, trimmed]);
        }
        setNewCropInput('');
    };

    const handleRemoveCrop = (cropToRemove) => {
        setCrops(crops.filter(c => c !== cropToRemove));
    };

    const toggleFarmer = (farmerId) => {
        if (selectedFarmerIds.includes(farmerId)) {
            setSelectedFarmerIds(selectedFarmerIds.filter(id => id !== farmerId));
        } else {
            setSelectedFarmerIds([...selectedFarmerIds, farmerId]);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.put(`/manager/farms/${farmId}/details`, { 
                farmer_ids: selectedFarmerIds,
                crop_types: crops
            });
            if (res.data.success) {
                alert('Berhasil menyimpan data lahan!');
                fetchData(farmId);
            }
        } catch (err) {
            alert('Gagal menyimpan data lahan.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ padding: '30px' }}>
            <div style={{ marginBottom: '20px' }}>
                <button className="action-btn view-btn" onClick={() => navigate('/manager/dashboard')}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                    Kembali ke Dashboard
                </button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ color: '#1B4332', margin: 0 }}>Kelola Lahan: {farm ? farm.name : '...'}</h1>
                    <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>Atur komoditas tanaman dan tugaskan banyak petani untuk lahan ini secara langsung.</p>
                </div>
                {farmList.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-main)' }}>Pilih Lahan:</label>
                        <select
                            value={farmId || ''}
                            onChange={handleSelectFarmChange}
                            className="form-input"
                            style={{ width: 'auto', minWidth: '200px' }}
                        >
                            {farmList.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {errorMsg && (
                <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #ef4444', marginBottom: '20px' }}>
                    {errorMsg}
                </div>
            )}

            {loading ? (
                <div>Memuat data...</div>
            ) : farm && (
                <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                    
                    {/* Section Petani */}
                    <div style={{ flex: '1 1 400px', background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ fontSize: '18px', color: '#111827', marginBottom: '15px' }}>Penugasan Petani</h2>
                        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>Pilih satu atau lebih petani yang bertanggung jawab atas lahan ini.</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                            {allFarmers.length === 0 ? (
                                <p style={{ fontSize: '14px', color: '#9ca3af' }}>Belum ada data petani di perusahaan ini.</p>
                            ) : (
                                allFarmers.map(farmer => (
                                    <label key={farmer.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', background: selectedFarmerIds.includes(farmer.id) ? '#f0fdf4' : 'white' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedFarmerIds.includes(farmer.id)}
                                            onChange={() => toggleFarmer(farmer.id)}
                                            style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#374151' }}>{farmer.name}</div>
                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{farmer.phone || 'Tidak ada no telepon'}</div>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Section Tanaman */}
                    <div style={{ flex: '1 1 400px', background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ fontSize: '18px', color: '#111827', marginBottom: '15px' }}>Jenis Tanaman (Komoditas)</h2>
                        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>Tambahkan semua jenis tanaman yang dibudidayakan di lahan ini.</p>
                        
                        <form onSubmit={handleAddCrop} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <input 
                                type="text" 
                                value={newCropInput}
                                onChange={(e) => setNewCropInput(e.target.value)}
                                placeholder="Cth: Kopi Arabika, Jagung Manis"
                                style={{ flex: 1, padding: '10px 15px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                            />
                            <button type="submit" className="primary-btn" style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                                Tambah
                            </button>
                        </form>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {crops.length === 0 ? (
                                <p style={{ fontSize: '14px', color: '#9ca3af', fontStyle: 'italic' }}>Belum ada tanaman yang ditambahkan.</p>
                            ) : (
                                crops.map((crop, idx) => (
                                    <div key={idx} style={{ background: '#d1fae5', color: '#065f46', padding: '6px 14px', borderRadius: '20px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {crop}
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveCrop(crop)}
                                            style={{ background: 'transparent', border: 'none', color: '#047857', cursor: 'pointer', padding: '0', fontSize: '16px', lineHeight: '1', display: 'flex' }}
                                        >&times;</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Save Button */}
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <button 
                            className="primary-btn" 
                            onClick={handleSave} 
                            disabled={saving}
                            style={{ padding: '12px 30px', fontSize: '16px', fontWeight: '600' }}
                        >
                            {saving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerFarmManagement;
