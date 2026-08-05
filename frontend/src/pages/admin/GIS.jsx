import React, { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';
import { Plus, Map, Leaf, Maximize, Calendar, Sprout, Upload, FileCode, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

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

    // State for creating farm (GeoJSON view)
    const [isCreatingFarm, setIsCreatingFarm] = useState(false);
    const [companies, setCompanies] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [drawnGeometry, setDrawnGeometry] = useState(null);
    const [formData, setFormData] = useState({ name: '', project_id: '', crop_variety: '', total_area_ha: '' });
    const [geoJsonText, setGeoJsonText] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [geoJsonStatus, setGeoJsonStatus] = useState(null);

    useEffect(() => {
        fetchFarms();
        fetchCompanies();
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

    const processGeoJsonString = (jsonStr) => {
        setGeoJsonStatus(null);
        if (!jsonStr.trim()) {
            setGeoJsonStatus({ success: false, message: 'Harap masukkan data GeoJSON atau unggah file.' });
            return;
        }
        try {
            const data = JSON.parse(jsonStr);
            let geom = data;

            if (data.type === 'FeatureCollection' && data.features && data.features.length > 0) {
                geom = data.features[0].geometry;
            } else if (data.type === 'Feature' && data.geometry) {
                geom = data.geometry;
            }

            if (geom && (geom.type === 'Polygon' || geom.type === 'MultiPolygon')) {
                setDrawnGeometry(geom);
                setGeoJsonStatus({ success: true, message: `Geometri valid: ${geom.type}` });
                setIsModalOpen(true);
            } else {
                setGeoJsonStatus({ success: false, message: 'Format GeoJSON tidak valid. Pastikan data mengandung Polygon atau MultiPolygon.' });
            }
        } catch (error) {
            setGeoJsonStatus({ success: false, message: 'Format JSON tidak valid. Periksa sintaks teks JSON Anda.' });
        }
    };

    const handleFileUpload = (file) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setGeoJsonText(event.target.result);
            processGeoJsonString(event.target.result);
        };
        reader.readAsText(file);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
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
            setGeoJsonText('');
            setGeoJsonStatus(null);
            setIsCreatingFarm(false);
            fetchFarms();
        } catch (error) {
            alert(error.response?.data?.message || "Terjadi kesalahan saat menyimpan!");
        }
    };

    const totalFarms = farms.length;
    const totalArea = farms.reduce((sum, f) => sum + (f.total_area_ha || 0), 0);
    const totalCrops = farms.reduce((sum, f) => sum + (f.total_crops || 0), 0);

    if (isCreatingFarm) {
        return (
            <div style={{ padding: '24px 30px', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h1 style={{ color: '#1B4332', fontSize: '24px', margin: '0 0 6px 0', fontWeight: '700' }}>Buat Lahan Baru (Input GeoJSON)</h1>
                        <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Unggah file .geojson atau masukkan raw JSON untuk menentukan batas area lahan.</p>
                    </div>
                    <button className="secondary-btn" onClick={() => { setIsCreatingFarm(false); setGeoJsonStatus(null); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ArrowLeft size={16} />
                        Kembali
                    </button>
                </div>

                {geoJsonStatus && (
                    <div style={{
                        padding: '14px 18px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '14px',
                        backgroundColor: geoJsonStatus.success ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${geoJsonStatus.success ? '#bbf7d0' : '#fecaca'}`,
                        color: geoJsonStatus.success ? '#15803d' : '#b91c1c'
                    }}>
                        {geoJsonStatus.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <span>{geoJsonStatus.message}</span>
                    </div>
                )}
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                    {/* Opsi 1: Upload File */}
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ padding: '8px', backgroundColor: '#e6f4eb', borderRadius: '8px', color: '#1B4332' }}>
                                <Upload size={20} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, color: '#1B4332', fontSize: '16px', fontWeight: '600' }}>Upload File GeoJSON</h3>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Pilih atau seret file .geojson / .json ke area ini</p>
                            </div>
                        </div>

                        <div 
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            style={{
                                border: `2px dashed ${dragActive ? '#1B4332' : '#cbd5e1'}`,
                                backgroundColor: dragActive ? '#f0fdf4' : '#fafafa',
                                borderRadius: '10px',
                                padding: '40px 20px',
                                textAlign: 'center',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                            }}
                            onClick={() => document.getElementById('geojson-file-input').click()}
                        >
                            <Upload size={36} color="#64748b" style={{ marginBottom: '12px' }} />
                            <p style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                                Klik untuk mengunggah atau drag & drop
                            </p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Format yang didukung: .geojson, .json</p>
                            <input 
                                id="geojson-file-input"
                                type="file" 
                                accept=".geojson, .json" 
                                onChange={(e) => handleFileUpload(e.target.files[0])} 
                                style={{ display: 'none' }} 
                            />
                        </div>
                    </div>

                    {/* Opsi 2: Paste Raw JSON */}
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ padding: '8px', backgroundColor: '#e6f4eb', borderRadius: '8px', color: '#1B4332' }}>
                                <FileCode size={20} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, color: '#1B4332', fontSize: '16px', fontWeight: '600' }}>Tempelkan Raw GeoJSON</h3>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Salin dan tempelkan teks GeoJSON dari perangkat Anda</p>
                            </div>
                        </div>

                        <textarea 
                            rows="9" 
                            style={{ 
                                width: '100%', 
                                padding: '14px', 
                                borderRadius: '8px', 
                                border: '1px solid #cbd5e1', 
                                fontFamily: 'Fira Code, monospace, sans-serif', 
                                fontSize: '13px',
                                color: '#1e293b',
                                backgroundColor: '#f8fafc',
                                marginBottom: '16px',
                                resize: 'vertical'
                            }} 
                            placeholder='{\n  "type": "Feature",\n  "geometry": {\n    "type": "Polygon",\n    "coordinates": [[[106.8, -6.2], ...]]\n  }\n}'
                            value={geoJsonText}
                            onChange={(e) => setGeoJsonText(e.target.value)}
                        />
                        <button 
                            className="primary-btn" 
                            onClick={() => processGeoJsonString(geoJsonText)}
                            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                        >
                            <CheckCircle2 size={16} />
                            Proses & Lanjutkan
                        </button>
                    </div>
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
