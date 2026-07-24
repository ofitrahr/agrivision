import React, { useEffect, useState, useRef } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';

const ManagerGIS = () => {
    const [farms, setFarms] = useState([]);
    const [selectedFarm, setSelectedFarm] = useState(null);
    const [blocks, setBlocks] = useState([]);
    const [farmers, setFarmers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mapHtml, setMapHtml] = useState('');
    
    // State untuk form penambahan blok
    const [drawnGeometry, setDrawnGeometry] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [isOtherCrop, setIsOtherCrop] = useState(false);
    const [newBlock, setNewBlock] = useState({
        name: '',
        crop_type: '',
        area_ha: '',
        farmer_id: ''
    });

    const navigate = useNavigate();

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const [farmsRes, farmersRes] = await Promise.all([
                    api.get('/manager/farms'),
                    api.get('/manager/farmers')
                ]);
                
                if (farmsRes.data.success) {
                    setFarms(farmsRes.data.data);
                    if (farmsRes.data.data.length > 0) {
                        handleSelectFarm(farmsRes.data.data[0]);
                    }
                }
                if (farmersRes.data.success) {
                    setFarmers(farmersRes.data.data);
                }
            } catch (error) {
                console.error("Gagal memuat data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const handleSelectFarm = async (farm) => {
        setSelectedFarm(farm);
        setDrawnGeometry(null);
        setShowForm(false);
        setMapHtml(''); // Reset map HTML
        try {
            // Fetch blocks and map HTML concurrently
            const [blocksRes, mapRes] = await Promise.all([
                api.get(`/manager/farms/${farm.id}/blocks`),
                api.get(`/manager/farms/${farm.id}/map`)
            ]);
            
            if (blocksRes.data.success) {
                setBlocks(blocksRes.data.data);
            }
            if (mapRes.data.success) {
                setMapHtml(mapRes.data.data.html);
            }
        } catch (error) {
            console.error("Gagal memuat detail lahan", error);
        }
    };

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data && event.data.type === 'GIS_DRAW_CREATED') {
                const geometry = event.data.geometry;
                if (geometry.type === 'Polygon') {
                    // Convert GeoJSON coordinates array ke WKT POLYGON((...))
                    const coords = geometry.coordinates[0];
                    const wktCoords = coords.map(c => `${c[0]} ${c[1]}`).join(', ');
                    const wkt = `POLYGON((${wktCoords}))`;
                    setDrawnGeometry(wkt);
                    setShowForm(true);
                } else {
                    alert('Harap gambar bentuk Polygon (Area tertutup) untuk Blok Lahan.');
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleSaveBlock = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newBlock,
                polygon_wkt: drawnGeometry
            };
            
            const response = await api.post(`/manager/farms/${selectedFarm.id}/blocks`, payload);
            
            if (response.data.success) {
                alert('Blok lahan berhasil ditambahkan!');
                setShowForm(false);
                setDrawnGeometry(null);
                setIsOtherCrop(false);
                setNewBlock({ name: '', crop_type: '', area_ha: '', farmer_id: '' });
                // Refresh list blok & iframe (untuk memunculkan blok baru di peta);
                handleSelectFarm(selectedFarm);
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal menyimpan blok lahan');
        }
    };

    if (loading && farms.length === 0) return <div style={{padding: '30px'}}>Memuat Peta Lahan...</div>;

    return (
        <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <button className="action-btn view-btn" onClick={() => navigate('/manager/dashboard')} style={{ marginBottom: '10px' }}>⬅ Kembali ke Dashboard</button>
                    <h1 style={{ color: '#1B4332', margin: 0 }}>Peta Lahan & Manajemen Blok</h1>
                </div>
                
                {farms.length > 0 && (
                    <div>
                        <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Pilih Lahan Utama:</label>
                        <select 
                            style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #ccc' }}
                            value={selectedFarm?.id || ''}
                            onChange={(e) => {
                                const farm = farms.find(f => f.id === e.target.value);
                                handleSelectFarm(farm);
                            }}
                        >
                            {farms.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {farms.length === 0 ? (
                <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '12px' }}>
                    <p style={{ margin: 0, color: '#92400e' }}>Belum ada lahan utama yang ditugaskan ke perusahaan Anda oleh Super Admin.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
                    {/* Bagian Peta Kiri */}
                    <div style={{ flex: '2', display: 'flex', flexDirection: 'column', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ padding: '10px 15px', background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                            <strong>Peta Area: {selectedFarm?.name}</strong>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>Gunakan ikon Polygon di peta untuk menggambar blok baru.</span>
                        </div>
                        {selectedFarm && mapHtml && (
                            <iframe 
                                key={selectedFarm.id + blocks.length}
                                srcDoc={mapHtml}
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                title="Farm Map"
                            />
                        )}
                    </div>

                    {/* Bagian Sidebar Kanan (Form & List) */}
                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                        
                        {/* Form Tambah Blok */}
                        {showForm && (
                            <div style={{ background: '#ecfdf5', padding: '20px', borderRadius: '12px', border: '1px solid #34d399' }}>
                                <h3 style={{ marginTop: 0, color: '#065f46' }}>Simpan Blok Baru</h3>
                                <p style={{ fontSize: '12px', color: '#047857', marginBottom: '15px' }}>Area tergambar, lengkapi data berikut:</p>
                                
                                <form onSubmit={handleSaveBlock} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Nama Blok *</label>
                                        <input type="text" style={{ width: '100%', padding: '8px' }} required 
                                            value={newBlock.name} onChange={e => setNewBlock({...newBlock, name: e.target.value})} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Jenis Tanaman Utama</label>
                                        <select style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                                            value={isOtherCrop ? "Lainnya" : newBlock.crop_type}
                                            onChange={(e) => {
                                                if (e.target.value === "Lainnya") {
                                                    setIsOtherCrop(true);
                                                    setNewBlock({...newBlock, crop_type: ''}); // Reset nilai
                                                } else {
                                                    setIsOtherCrop(false);
                                                    setNewBlock({...newBlock, crop_type: e.target.value});
                                                }
                                            }}>
                                            <option value="">-- Pilih Tanaman --</option>
                                            <option value="Kopi">Kopi</option>
                                            <option value="Lada">Lada</option>
                                            <option value="Sereh Wangi">Sereh Wangi</option>
                                            <option value="Lainnya">Lainnya...</option>
                                        </select>

                                        {isOtherCrop && (
                                            <input type="text" placeholder="Ketik nama komoditas spesifik..." 
                                                   style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px dashed #6b7280' }}
                                                   value={newBlock.crop_type} 
                                                   onChange={e => setNewBlock({...newBlock, crop_type: e.target.value})} 
                                                   required />
                                        )}
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Luas (Hektar)</label>
                                        <input type="number" step="0.01" style={{ width: '100%', padding: '8px' }} 
                                            value={newBlock.area_ha} onChange={e => setNewBlock({...newBlock, area_ha: e.target.value})} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Tugaskan Pekerja (Petani)</label>
                                        <select style={{ width: '100%', padding: '8px' }} 
                                            value={newBlock.farmer_id} onChange={e => setNewBlock({...newBlock, farmer_id: e.target.value})}>
                                            <option value="">-- Pilih Pekerja --</option>
                                            {farmers.map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        <button type="submit" className="primary-btn" style={{ flex: 1 }}>Simpan</button>
                                        <button type="button" className="danger-btn" onClick={() => {setShowForm(false); setDrawnGeometry(null); setIsOtherCrop(false);}} style={{ flex: 1 }}>Batal</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* List Blok yang sudah ada */}
                        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', flex: 1 }}>
                            <h3 style={{ marginTop: 0, color: '#374151' }}>Daftar Blok Lahan</h3>
                            {blocks.length === 0 ? (
                                <p style={{ color: '#6b7280', fontSize: '14px' }}>Belum ada blok di lahan ini. Silakan gambar di peta.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {blocks.map(b => {
                                        const farmer = farmers.find(f => f.id === b.farmer_id);
                                        return (
                                            <div key={b.id} style={{ padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                                                <div style={{ fontWeight: 'bold', color: '#1f2937' }}>{b.name}</div>
                                                <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '5px' }}>
                                                    Tanaman: {b.crop_type || '-'} <br/>
                                                    Luas: {b.area_ha || 0} Ha <br/>
                                                    Pekerja: {farmer ? farmer.name : <span style={{color:'#ef4444'}}>Belum ditugaskan</span>}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerGIS;
