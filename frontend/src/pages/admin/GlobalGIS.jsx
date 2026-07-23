import React, { useEffect, useState } from 'react';
import api from '../../shared/api/axios';

const GlobalGIS = () => {
    const [mapHtml, setMapHtml] = useState('');
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState([]);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [drawnGeometry, setDrawnGeometry] = useState(null);
    const [formData, setFormData] = useState({ name: '', company_id: '', crop_variety: '', total_area_ha: '' });

    useEffect(() => {
        fetchMap();
        fetchCompanies();

        const handleMessage = (event) => {
            if (event.data && event.data.type === 'GIS_DRAW_CREATED') {
                setDrawnGeometry(event.data.geometry);
                setIsModalOpen(true);
            }
        };
        window.addEventListener('message', handleMessage);
        
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const fetchMap = async () => {
        try {
            const response = await api.get('/admin/gis/map');
            if (response.data.success) setMapHtml(response.data.data.html);
        } catch (error) {
            console.error("Gagal mengambil Peta Global", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanies = async () => {
        try {
            const response = await api.get('/admin/companies');
            if (response.data.success) setCompanies(response.data.data);
        } catch (error) {
            console.error("Gagal mengambil data company", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, geometry: drawnGeometry };
            
            await api.post('/admin/farms', payload);
            
            alert('Lahan berhasil disimpan & ditugaskan!');
            setIsModalOpen(false);
            setFormData({ name: '', company_id: '', crop_variety: '', total_area_ha: '' });
            fetchMap();
        } catch (error) {
            alert(error.response?.data?.message || "Terjadi kesalahan saat menyimpan!");
        }
    };

    if (loading) return <div style={{ padding: '30px' }}>Memuat Peta Global Folium...</div>;

    return (
        <div style={{ padding: '30px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ color: '#1B4332', marginBottom: '20px' }}>Global GIS & Pemetaan Lahan</h1>
            
            <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: '2px solid #2D6A4F', position: 'relative' }}>
                <iframe title="Agrivision Global GIS" srcDoc={mapHtml} style={{ width: '100%', height: '100%', border: 'none' }} />
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Simpan Lahan Baru</h2>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nama Lahan (Farm) *</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Assign ke Company *</label>
                                <select value={formData.company_id} onChange={(e) => setFormData({...formData, company_id: e.target.value})} required>
                                    <option value="">-- Pilih Company --</option>
                                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Komoditas (Varietas)</label>
                                    <input type="text" value={formData.crop_variety} onChange={(e) => setFormData({...formData, crop_variety: e.target.value})} placeholder="Cth: Kelapa Sawit" />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Luas Lahan (Ha)</label>
                                    <input type="number" step="0.01" value={formData.total_area_ha} onChange={(e) => setFormData({...formData, total_area_ha: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Batal</button>
                                <button type="submit" className="primary-btn">Simpan Lahan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalGIS;