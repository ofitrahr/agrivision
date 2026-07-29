import React, { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';

const ManagerAgronomy = () => {
    const navigate = useNavigate();
    const [farms, setFarms] = useState([]);
    const [selectedFarm, setSelectedFarm] = useState(null);
    const [mapHtml, setMapHtml] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [selectedLayer, setSelectedLayer] = useState('ndvi');
    const [permissions, setPermissions] = useState(null);

    useEffect(() => {
        fetchFarms();
    }, []);

    useEffect(() => {
        if (selectedFarm) {
            loadAgronomyMap(selectedFarm.id, selectedLayer);
        }
    }, [selectedLayer]);

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
            console.error(error);
        }
    };

    const loadAgronomyMap = async (farmId, layer = selectedLayer) => {
        setLoading(true);
        setErrorMsg('');
        setMapHtml('');
        try {
            const response = await api.get(`/manager/farms/${farmId}/agronomy-map`, { params: { layer } });
            if (response.data.success) {
                setMapHtml(response.data.data.html);
                setSelectedFarm(farms.find(f => f.id === farmId));
            }
        } catch (error) {
            if (error.response && error.response.status === 403) {
                setErrorMsg(error.response.data.message || 'Akses ditolak.');
            } else {
                setErrorMsg('Gagal memuat peta agronomi.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '30px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <button className="action-btn view-btn" onClick={() => navigate('/manager/dashboard')}> Kembali ke Dashboard</button>
            </div>
            
            <h1 style={{ color: '#1B4332', marginBottom: '10px' }}> Modul Agronomi & Pemantauan Satelit</h1>
            <p style={{ color: '#6b7280', marginBottom: '30px' }}>Pilih lahan untuk melihat indeks kesehatan tanaman (NDVI) dan estimasi biomassa.</p>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {farms.map(farm => (
                    <button 
                        key={farm.id}
                        className={`action-btn ${selectedFarm?.id === farm.id ? 'primary-btn' : 'edit-btn'}`}
                        onClick={() => loadAgronomyMap(farm.id)}
                    >
                        {farm.name}
                    </button>
                ))}
            </div>

            {errorMsg && (
                <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                    <strong>Akses Terbatas:</strong> {errorMsg}
                </div>
            )}

            {loading && <div>Memuat citra satelit dan data...</div>}

            {selectedFarm && !errorMsg && (
                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <label style={{ fontWeight: 'bold' }}>Tipe Layer Peta:</label>
                    <select 
                        value={selectedLayer} 
                        onChange={e => setSelectedLayer(e.target.value)}
                        style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #ccc' }}
                    >
                        {(!permissions || permissions.can_access_ndvi) && <option value="ndvi">Indeks Kesehatan Tanaman (NDVI)</option>}
                        {permissions?.can_access_soc && <option value="soc">Soil Organic Carbon (SOC)</option>}
                        {permissions?.can_access_biomass && <option value="biomass">Estimasi Biomassa Karbon</option>}
                    </select>
                </div>
            )}

            {mapHtml && !errorMsg && (
                <div style={{ marginTop: '20px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e5e7eb', height: '60vh' }}>
                    <iframe 
                        srcDoc={mapHtml} 
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        title="Agronomy Map"
                    />
                </div>
            )}
        </div>
    );
};

export default ManagerAgronomy;
