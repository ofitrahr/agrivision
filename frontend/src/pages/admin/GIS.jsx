import React, { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';
import { Plus, Map, Leaf, Maximize, Calendar, Sprout } from 'lucide-react';

const FarmMapThumbnail = ({ farmId }) => {
    const [mapHtml, setMapHtml] = useState(null);

    useEffect(() => {
        api.get(`/admin/farms/${farmId}/map?thumbnail=true`).then(res => {
            if (res.data.success) {
                setMapHtml(res.data.data.html);
            }
        }).catch(() => {
            // ignore error for thumbnails
        });
    }, [farmId]);

    if (!mapHtml) {
        return (
            <div style={{ height: '100%', background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                <Map size={48} opacity={0.5} />
            </div>
        );
    }

    return (
        <div style={{ height: '100%', width: '100%', pointerEvents: 'none' }}>
            <iframe 
                srcDoc={mapHtml} 
                style={{ width: '100%', height: '100%', border: 'none' }} 
                title={`Map-${farmId}`} 
                scrolling="no"
            />
        </div>
    );
};

const GIS = () => {
    // State for grid view
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // State for creating farm (map view)
    const [isCreatingFarm, setIsCreatingFarm] = useState(false);
    const [mapHtml, setMapHtml] = useState('');
    const [companies, setCompanies] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [drawnGeometry, setDrawnGeometry] = useState(null);
    const [formData, setFormData] = useState({ name: '', project_id: '', crop_variety: '', total_area_ha: '' });

    useEffect(() => {
        fetchFarms();
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

    useEffect(() => {
        if (selectedCompanyId) {
            fetchProjects(selectedCompanyId);
        } else {
            setProjects([]);
        }
    }, [selectedCompanyId]);

    const fetchFarms = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/farms');
            if (response.data.success) {
                setFarms(response.data.data);
            }
        } catch (error) {
            console.error("Gagal mengambil data lahan", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMap = async () => {
        try {
            const response = await api.get('/admin/gis/map');
            if (response.data.success) setMapHtml(response.data.data.html);
        } catch (error) {
            console.error("Gagal mengambil Peta Global", error);
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

    const fetchProjects = async (companyId) => {
        try {
            const response = await api.get(`/admin/companies/${companyId}/projects`);
            if (response.data.success) setProjects(response.data.data);
        } catch (error) {
            console.error("Gagal mengambil data project", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, geometry: drawnGeometry };
            
            await api.post('/admin/farms', payload);
            
            alert('Lahan berhasil disimpan & ditugaskan!');
            setIsModalOpen(false);
            setFormData({ name: '', project_id: '', crop_variety: '', total_area_ha: '' });
            setSelectedCompanyId('');
            setIsCreatingFarm(false);
            fetchFarms(); // Refresh grid
            fetchMap();   // Refresh map
        } catch (error) {
            alert(error.response?.data?.message || "Terjadi kesalahan saat menyimpan!");
        }
    };

    const totalFarms = farms.length;
    const totalArea = farms.reduce((sum, f) => sum + (f.total_area_ha || 0), 0);
    const totalCrops = farms.reduce((sum, f) => sum + (f.total_crops || 0), 0);

    if (isCreatingFarm) {
        return (
            <div style={{ padding: '30px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1 style={{ color: '#1B4332', margin: 0 }}>Buat Lahan Baru (Global GIS)</h1>
                    <button className="secondary-btn" onClick={() => setIsCreatingFarm(false)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                        Batal
                    </button>
                </div>
                
                <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: '2px solid #2D6A4F', position: 'relative' }}>
                    {mapHtml ? (
                        <iframe title="Agrivision Global GIS" srcDoc={mapHtml} style={{ width: '100%', height: '100%', border: 'none' }} />
                    ) : (
                        <div style={{ padding: '30px' }}>Memuat Peta...</div>
                    )}
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
                                    <label>Assign ke Company</label>
                                    <select value={selectedCompanyId} onChange={(e) => {
                                        setSelectedCompanyId(e.target.value);
                                        setFormData({...formData, project_id: ''});
                                    }}>
                                        <option value="">-- Pilih Company --</option>
                                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Assign ke Project *</label>
                                    <select value={formData.project_id} onChange={(e) => setFormData({...formData, project_id: e.target.value})} required disabled={!selectedCompanyId}>
                                        <option value="">-- Pilih Project --</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
    }

    // Default view: Grid
    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 className="page-title" style={{ fontSize: '24px', margin: 0 }}>Global GIS & Lahan</h1>
                <button className="primary-btn" onClick={() => setIsCreatingFarm(true)}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                    Add New Farm
                </button>
            </div>
            
            {/* Overview Cards */}
            <div className="grid-cards" style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                <div className="stat-card" style={{ flex: 1, padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                    <h3 style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Leaf size={16} color="#10b981" /> Total Farms
                    </h3>
                    {loading ? (
                        <div className="skeleton-text" style={{ width: '60px', height: '30px' }}></div>
                    ) : (
                        <p className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{totalFarms}</p>
                    )}
                </div>
                <div className="stat-card" style={{ flex: 1, padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                    <h3 style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Map size={16} color="#10b981" /> Total Area
                    </h3>
                    {loading ? (
                        <div className="skeleton-text" style={{ width: '60px', height: '30px' }}></div>
                    ) : (
                        <p className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{totalArea.toFixed(2)} ha</p>
                    )}
                </div>
                <div style={{ flex: 1 }}></div>
            </div>

            <h2 style={{ fontSize: '18px', margin: '0 0 20px 0' }}>Farm List</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {loading ? (
                    <div style={{ padding: '20px' }}>Memuat data lahan...</div>
                ) : farms.length === 0 ? (
                    <div style={{ padding: '20px', color: '#6b7280', background: 'white', borderRadius: '8px' }}>Belum ada lahan terdaftar.</div>
                ) : (
                    farms.map((farm) => (
                        <div key={farm.id} onClick={() => alert("Lahan ini memiliki " + farm.total_area_ha + " ha.")} style={{ cursor: 'pointer', background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-2px)' } }}>
                            <div style={{ height: '150px', background: '#374151', overflow: 'hidden' }}>
                                <FarmMapThumbnail farmId={farm.id} />
                            </div>
                            <div style={{ padding: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>
                                        {farm.name}
                                    </h3>
                                </div>
                                <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 15px 0' }}>Project: {farm.project_name}</p>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#4b5563', marginBottom: '8px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Maximize size={14} color="#10b981" /> {farm.total_area_ha} ha
                                    </span>
                                </div>
                                <div style={{ fontSize: '13px', color: '#4b5563', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Leaf size={14} color="#10b981" /> {farm.crop_variety || 'Belum di set'}
                                </div>
                                

                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default GIS;
