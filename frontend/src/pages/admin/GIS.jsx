import React, { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';
import { Plus, Map, Leaf, Maximize, Calendar, Sprout, Upload, FileCode, CheckCircle2, AlertCircle, ArrowLeft, UploadCloud, Loader2, Sparkles, X, CheckCircle, Satellite } from 'lucide-react';
import InputNumber from '../../shared/components/UI/InputNumber';
import AdminGISUploader from './AdminGISUploader';

const MONTH_NAMES_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const getCurrentPeriodId = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const formatPeriodLabel = (yyyyMm) => {
    if (!yyyyMm || !yyyyMm.includes('-')) return yyyyMm || '-';
    const [year, month] = yyyyMm.split('-');
    const idx = parseInt(month, 10) - 1;
    return idx >= 0 && idx < 12 ? `${MONTH_NAMES_ID[idx]} ${year}` : yyyyMm;
};

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
    const [isUploadingData, setIsUploadingData] = useState(false);
    const [companies, setCompanies] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [drawnGeometry, setDrawnGeometry] = useState(null);
    const [formData, setFormData] = useState({ name: '', project_id: '', crop_variety: '', total_area_ha: '' });
    const [geoJsonText, setGeoJsonText] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [geoJsonStatus, setGeoJsonStatus] = useState(null);

    // State untuk Analisis Satelit GEE & Model AI
    const [observationPeriod, setObservationPeriod] = useState(getCurrentPeriodId());
    const [analyzingFarm, setAnalyzingFarm] = useState(null);
    const [loadingStep, setLoadingStep] = useState(1);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [selectedMapFarm, setSelectedMapFarm] = useState(null);
    const [mapModalHtml, setMapModalHtml] = useState(null);
    const [mapModalLoading, setMapModalLoading] = useState(false);

    const handleRunObservation = async (e, farm) => {
        e.stopPropagation();
        setAnalyzingFarm(farm);
        setLoadingStep(1);

        const timer = setInterval(() => {
            setLoadingStep(prev => (prev < 3 ? prev + 1 : prev));
        }, 3500);

        try {
            const res = await api.post(`/admin/farms/${farm.id}/run-observation`, {
                period: observationPeriod
            });
            if (res.data.success) {
                setAnalysisResult(res.data);
            }
        } catch (err) {
            alert("Gagal menjalankan analisis satelit: " + (err.response?.data?.message || err.message));
        } finally {
            clearInterval(timer);
            setAnalyzingFarm(null);
        }
    };

    const handleOpenMapModal = async (e, farm) => {
        e.stopPropagation();
        setSelectedMapFarm(farm);
        setMapModalLoading(true);
        try {
            const res = await api.get(`/admin/farms/${farm.id}/map`);
            if (res.data.success) {
                setMapModalHtml(res.data.data.html);
            }
        } catch (err) {
            console.error("Gagal memuat peta lahan", err);
        } finally {
            setMapModalLoading(false);
        }
    };

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

    const calculatePolygonAreaHa = (geometry) => {
        if (!geometry) return 0;
        const RADIUS = 6378137; // Jari-jari bumi WGS84 dalam meter

        const ringArea = (coords) => {
            let area = 0;
            if (!coords || coords.length < 3) return 0;
            for (let i = 0; i < coords.length - 1; i++) {
                const p1 = coords[i];
                const p2 = coords[i + 1];
                const lon1 = p1[0] * Math.PI / 180;
                const lat1 = p1[1] * Math.PI / 180;
                const lon2 = p2[0] * Math.PI / 180;
                const lat2 = p2[1] * Math.PI / 180;
                area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
            }
            area = area * RADIUS * RADIUS / 2.0;
            return Math.abs(area);
        };

        let totalM2 = 0;
        if (geometry.type === 'Polygon' && geometry.coordinates) {
            totalM2 = ringArea(geometry.coordinates[0]);
            for (let h = 1; h < geometry.coordinates.length; h++) {
                totalM2 -= ringArea(geometry.coordinates[h]);
            }
        } else if (geometry.type === 'MultiPolygon' && geometry.coordinates) {
            for (const poly of geometry.coordinates) {
                totalM2 += ringArea(poly[0]);
                for (let h = 1; h < poly.length; h++) {
                    totalM2 -= ringArea(poly[h]);
                }
            }
        }

        const ha = totalM2 / 10000;
        return Math.round(ha * 100) / 100;
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
                const autoHa = calculatePolygonAreaHa(geom);
                setDrawnGeometry(geom);
                setFormData(prev => ({
                    ...prev,
                    total_area_ha: autoHa > 0 ? autoHa : prev.total_area_ha
                }));
                setGeoJsonStatus({ 
                    success: true, 
                    message: `Geometri valid: ${geom.type} • Estimasi Luas: ${autoHa} Ha (Otomatis terisi, dapat diedit)` 
                });
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
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <label style={{ margin: 0 }}>Luas Lahan (Ha) *</label>
                                            <span style={{ fontSize: '10px', color: '#15803d', background: '#dcfce7', padding: '1px 6px', borderRadius: '6px' }}>
                                                Auto / Editable
                                            </span>
                                        </div>
                                        <InputNumber min="0.01" step="0.01" value={formData.total_area_ha} onChange={(e) => setFormData({...formData, total_area_ha: e.target.value})} placeholder="Cth: 2.5" required />
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

    if (isUploadingData) {
        return (
            <div style={{ padding: '24px 30px', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h1 style={{ color: '#1B4332', fontSize: '24px', margin: '0 0 6px 0', fontWeight: '700' }}>Import Data ML</h1>
                        <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Unggah file hasil prediksi (Sentinel-2) untuk diintegrasikan ke Lahan.</p>
                    </div>
                    <button className="secondary-btn" onClick={() => setIsUploadingData(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ArrowLeft size={16} />
                        Kembali
                    </button>
                </div>
                <AdminGISUploader />
            </div>
        );
    }

    // Default view: Grid
    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h1 className="page-title" style={{ fontSize: '24px', margin: 0 }}>Global GIS & Lahan</h1>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label htmlFor="observation-period" style={{ fontSize: '13px', color: '#4b5563', fontWeight: 500 }}>
                            Periode Observasi:
                        </label>
                        <input
                            id="observation-period"
                            type="month"
                            value={observationPeriod}
                            onChange={(e) => setObservationPeriod(e.target.value)}
                            style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px' }}
                        />
                    </div>
                    <button className="secondary-btn" onClick={() => setIsUploadingData(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #10b981', color: '#10b981', background: 'transparent' }}>
                        <UploadCloud size={16} />
                        Import Data ML
                    </button>
                    <button className="primary-btn" onClick={() => setIsCreatingFarm(true)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                        Add New Farm
                    </button>
                </div>
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
                        <div key={farm.id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                            <div style={{ height: '150px', background: '#374151', overflow: 'hidden', position: 'relative' }}>
                                <FarmMapThumbnail farmId={farm.id} />
                            </div>
                            <div style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                                        {farm.name}
                                    </h3>
                                </div>
                                <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 12px 0' }}>Project: {farm.project_name}</p>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#4b5563', marginBottom: '6px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Maximize size={14} color="#10b981" /> {farm.total_area_ha} ha
                                    </span>
                                </div>
                                <div style={{ fontSize: '13px', color: '#4b5563', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Leaf size={14} color="#10b981" /> {farm.crop_variety || 'Belum di set'}
                                </div>

                                {/* Tombol Aksi Superadmin */}
                                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                                    <button 
                                        type="button"
                                        className="secondary-btn"
                                        onClick={(e) => handleOpenMapModal(e, farm)}
                                        style={{ flex: 1, fontSize: '12px', padding: '7px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', borderRadius: '6px' }}
                                    >
                                        <Map size={14} />
                                        Lihat Peta
                                    </button>
                                    <button 
                                        type="button"
                                        className="primary-btn"
                                        onClick={(e) => handleRunObservation(e, farm)}
                                        disabled={analyzingFarm?.id === farm.id}
                                        style={{ 
                                            flex: 1.3, 
                                            fontSize: '12px', 
                                            padding: '7px 8px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            gap: '5px', 
                                            borderRadius: '6px',
                                            backgroundColor: analyzingFarm?.id === farm.id ? '#94a3b8' : '#116a3a',
                                            cursor: analyzingFarm?.id === farm.id ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {analyzingFarm?.id === farm.id ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                Memproses GEE...
                                            </>
                                        ) : (
                                            <>
                                                Analisis Satelit
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal Animasi Loading Progresif saat Menunggu GEE & Model AI */}
            {analyzingFarm && (
                <div className="modal-overlay" style={{ zIndex: 10000 }}>
                    <div className="modal-content" style={{ maxWidth: '480px', borderRadius: '14px', padding: '28px', textAlign: 'center' }}>
                        <div style={{ 
                            width: '56px', 
                            height: '56px', 
                            borderRadius: '50%', 
                            backgroundColor: '#dcfce7', 
                            color: '#15803d', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            margin: '0 auto 16px auto' 
                        }}>
                            <Satellite size={28} className="animate-bounce" />
                        </div>

                        <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                            Menjalankan Analisis Satelit & AI
                        </h3>
                        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
                            Lahan: <strong>{analyzingFarm.name}</strong> • Periode: <strong>{formatPeriodLabel(observationPeriod)}</strong>
                        </p>

                        {/* Stepper Progres */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', marginBottom: '20px' }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px', 
                                padding: '10px 14px', 
                                borderRadius: '8px', 
                                background: loadingStep >= 1 ? '#f0fdf4' : '#f8fafc',
                                border: `1px solid ${loadingStep >= 1 ? '#bbf7d0' : '#e2e8f0'}`
                            }}>
                                {loadingStep > 1 ? (
                                    <CheckCircle size={18} color="#15803d" />
                                ) : (
                                    <Loader2 size={18} color="#15803d" className="animate-spin" />
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: loadingStep >= 1 ? '#166534' : '#64748b' }}>
                                        1. Mengunduh Citra Sentinel-2 & DEM SRTM
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>Koneksi Google Earth Engine API</div>
                                </div>
                            </div>

                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px', 
                                padding: '10px 14px', 
                                borderRadius: '8px', 
                                background: loadingStep >= 2 ? '#f0fdf4' : '#f8fafc',
                                border: `1px solid ${loadingStep >= 2 ? '#bbf7d0' : '#e2e8f0'}`
                            }}>
                                {loadingStep > 2 ? (
                                    <CheckCircle size={18} color="#15803d" />
                                ) : loadingStep === 2 ? (
                                    <Loader2 size={18} color="#15803d" className="animate-spin" />
                                ) : (
                                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #cbd5e1' }} />
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: loadingStep >= 2 ? '#166534' : '#64748b' }}>
                                        2. Ekstraksi 12 Indeks Spektral & Topografi
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>Kalkulasi elevasi, slope, aspect, TWI & reflektansi</div>
                                </div>
                            </div>

                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px', 
                                padding: '10px 14px', 
                                borderRadius: '8px', 
                                background: loadingStep >= 3 ? '#f0fdf4' : '#f8fafc',
                                border: `1px solid ${loadingStep >= 3 ? '#bbf7d0' : '#e2e8f0'}`
                            }}>
                                {loadingStep === 3 ? (
                                    <Loader2 size={18} color="#15803d" className="animate-spin" />
                                ) : (
                                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #cbd5e1' }} />
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: loadingStep >= 3 ? '#166534' : '#64748b' }}>
                                        3. Inferensi Machine Learning (Model ONNX AI)
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>StandardScaler + Artificial Neural Network</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            Proses memerlukan waktu 5 - 15 detik tergantung respons Google Earth Engine. Harap menunggu...
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Hasil Analisis Satelit GEE & AI */}
            {analysisResult && (
                <div className="modal-overlay" style={{ zIndex: 9999 }}>
                    <div className="modal-content" style={{ maxWidth: '640px', borderRadius: '14px', padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ padding: '6px', background: '#dcfce7', borderRadius: '8px', color: '#15803d' }}>
                                    <CheckCircle size={20} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111827' }}>Analisis Satelit Berhasil</h3>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{analysisResult.farm_name} ({formatPeriodLabel(analysisResult.period)})</p>
                                </div>
                            </div>
                            <button className="close-btn" onClick={() => setAnalysisResult(null)}>&times;</button>
                        </div>

                        {/* Grid 5 Parameter Observasi */}
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#374151' }}>Hasil 5 Parameter Observasi:</span>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>3 Selesai • 2 Menunggu Model R&D</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                                {/* 1. SOC (Active - Hasil Real AI) */}
                                <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '10px', padding: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#166534' }}>Stok Karbon (SOC)</span>
                                        <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 6px', borderRadius: '10px', background: analysisResult.is_anomaly ? '#fee2e2' : '#dcfce7', color: analysisResult.is_anomaly ? '#991b1b' : '#15803d' }}>
                                            {analysisResult.is_anomaly ? 'Waspada' : 'Normal'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#15803d', margin: '2px 0' }}>
                                        {analysisResult.soc_prediction} <span style={{ fontSize: '11px', fontWeight: '500' }}>Ton C/Ha</span>
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#166534' }}>
                                        {analysisResult.pixel_count ? (
                                            <>Sebaran: {analysisResult.pixel_count} piksel • Min: {analysisResult.min_soc} | Max: {analysisResult.max_soc}</>
                                        ) : (
                                            'Model ONNX Terverifikasi'
                                        )}
                                    </div>
                                </div>

                                {/* 2. Vegetasi NDVI */}
                                <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '10px', padding: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#166534' }}>Vegetasi (NDVI)</span>
                                        <span style={{
                                            fontSize: '10px', fontWeight: '600', padding: '2px 6px', borderRadius: '10px',
                                            background: analysisResult.ndvi_prediction > 0.4 ? '#dcfce7' : '#fee2e2',
                                            color: analysisResult.ndvi_prediction > 0.4 ? '#15803d' : '#991b1b'
                                        }}>
                                            {analysisResult.ndvi_prediction > 0.4 ? 'Sehat' : 'Kritis'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#15803d', margin: '2px 0' }}>
                                        {analysisResult.ndvi_prediction}
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#166534' }}>Sentinel-2 Index (B8/B4)</div>
                                </div>

                                {/* 3. Biomassa Karbon (Pending - belum ada model resmi) */}
                                <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>Biomassa Karbon</span>
                                        <span style={{ fontSize: '10px', fontWeight: '500', padding: '2px 6px', borderRadius: '10px', background: '#e2e8f0', color: '#64748b' }}>
                                            Menunggu Model R&D
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#94a3b8', margin: '2px 0' }}>-</div>
                                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Dalam tahap pengembangan</div>
                                </div>

                                {/* 4. Nutrisi NPK */}
                                <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '10px', padding: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#166534' }}>Nutrisi (NPK)</span>
                                        <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 6px', borderRadius: '10px', background: '#dcfce7', color: '#15803d' }}>
                                            Tercukupi
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#15803d', margin: '2px 0' }}>
                                        N: {analysisResult.npk_prediction?.nitrogen}%
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#166534' }}>
                                        P: {analysisResult.npk_prediction?.phosphorus} • K: {analysisResult.npk_prediction?.potassium} mg/kg
                                    </div>
                                </div>

                                {/* 5. Estimasi Yield (Pending - belum ada model resmi) */}
                                <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>Estimasi Yield</span>
                                        <span style={{ fontSize: '10px', fontWeight: '500', padding: '2px 6px', borderRadius: '10px', background: '#e2e8f0', color: '#64748b' }}>
                                            Menunggu Model R&D
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#94a3b8', margin: '2px 0' }}>-</div>
                                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Dalam tahap pengembangan</div>
                                </div>
                            </div>
                        </div>

                        {/* Informasi Citra Satelit & Topografi */}
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>Metadata Citra Satelit Sentinel-2 & DEM:</span>
                                {analysisResult.scene_info && (
                                    <span style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>
                                        Awan: {analysisResult.scene_info.cloud_percentage}%
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}>
                                    <span style={{ color: '#64748b' }}>Tanggal Citra: </span>
                                    <strong>{analysisResult.scene_info?.date?.slice(0, 10) ?? '-'}</strong>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}>
                                    <span style={{ color: '#64748b' }}>Variasi Spasial (Std Dev): </span>
                                    <strong>{analysisResult.std_soc ?? '-'}</strong>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}>
                                    <span style={{ color: '#64748b' }}>Elevasi Rata-rata: </span>
                                    <strong>{analysisResult.topography_captured?.elevation?.toFixed(1) ?? '-'} mdpl</strong>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}>
                                    <span style={{ color: '#64748b' }}>Kemiringan (Slope): </span>
                                    <strong>{analysisResult.topography_captured?.slope?.toFixed(1) ?? '-'}°</strong>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: '#f1f5f9', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: '#475569', marginBottom: '18px' }}>
                            ✓ Data observasi spasial ({analysisResult.pixel_count || 0} titik piksel) berhasil diproses dan disimpan ke sistem. Manajer dapat langsung melihat visualisasi heatmap di menu <strong>Index Observasi</strong>.
                        </div>

                        <button 
                            className="primary-btn" 
                            onClick={() => setAnalysisResult(null)}
                            style={{ 
                                width: '100%', 
                                padding: '10px 16px', 
                                fontSize: '13px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                textAlign: 'center',
                                fontWeight: '600'
                            }}
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Detail Peta Lahan */}
            {selectedMapFarm && (
                <div className="modal-overlay" style={{ zIndex: 9999 }}>
                    <div className="modal-content" style={{ maxWidth: '800px', width: '90%', borderRadius: '12px', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Peta Batas: {selectedMapFarm.name}</h3>
                                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{selectedMapFarm.total_area_ha} Ha - {selectedMapFarm.crop_variety || 'Komoditas belum di-set'}</p>
                            </div>
                            <button className="close-btn" onClick={() => { setSelectedMapFarm(null); setMapModalHtml(null); }}>&times;</button>
                        </div>
                        <div style={{ height: '450px', background: '#1e293b', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {mapModalLoading ? (
                                <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Loader2 size={20} className="animate-spin" /> Memuat peta interaktif...
                                </div>
                            ) : mapModalHtml ? (
                                <iframe 
                                    srcDoc={mapModalHtml} 
                                    style={{ width: '100%', height: '100%', border: 'none' }} 
                                    title={`ModalMap-${selectedMapFarm.id}`} 
                                />
                            ) : (
                                <div style={{ color: '#94a3b8' }}>Gagal memuat peta lahan</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GIS;
