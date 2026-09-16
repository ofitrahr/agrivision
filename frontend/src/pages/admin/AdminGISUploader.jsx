import { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../shared/api/axios';

const AdminGISUploader = () => {
  const [file, setFile] = useState(null);
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState('');
  const [period, setPeriod] = useState('Q1_2026');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const res = await api.get('/admin/farms');
        if (res.data.success) {
          setFarms(res.data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchFarms();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadStatus(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedFarm || !period) {
      setUploadStatus({ type: 'error', message: 'Harap lengkapi file, lahan, dan periode.' });
      return;
    }
    
    setIsUploading(true);
    setUploadStatus(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('farm_id', selectedFarm);
    formData.append('period', period);
    
    try {
      const res = await api.post('/admin/gis/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setUploadStatus({ type: 'success', message: res.data.message });
        setFile(null);
      }
    } catch (err) {
      setUploadStatus({ type: 'error', message: err.response?.data?.message || 'Gagal mengupload file.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E0EBE4' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>Import Data GIS (ML)</h2>
      <p style={{ fontSize: '14px', color: '#5C7A6D', marginBottom: '24px' }}>
        Upload hasil output dari Machine Learning (berformat CSV atau JSON) untuk diperbarui ke dalam sistem Agronomi.
        Sistem secara otomatis akan mengkalkulasi 5 parameter (NDVI, SOC, Biomass, Yield, SoilNPK).
      </p>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
            Target Lahan (Farm)
          </label>
          <select 
            value={selectedFarm} 
            onChange={(e) => setSelectedFarm(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
          >
            <option value="">-- Pilih Lahan --</option>
            {farms.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
            Periode Data
          </label>
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
          >
            <option value="Q1_2025">Jan - Mar 2025 (Q1)</option>
            <option value="Q2_2025">Apr - Jun 2025 (Q2)</option>
            <option value="Q3_2025">Jul - Sep 2025 (Q3)</option>
            <option value="Q4_2025">Okt - Des 2025 (Q4)</option>
            <option value="Q1_2026">Jan - Mar 2026 (Q1)</option>
          </select>
        </div>
      </div>

      <div 
        style={{ 
          border: '2px dashed #116a3a', borderRadius: '8px', padding: '40px 20px', 
          textAlign: 'center', backgroundColor: '#F0FDF4', marginBottom: '24px',
          position: 'relative'
        }}
      >
        <UploadCloud size={32} color="#116a3a" style={{ margin: '0 auto 12px' }} />
        <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#116a3a' }}>
          {file ? file.name : 'Klik atau seret file CSV/JSON ke sini'}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#5C7A6D' }}>
          Mendukung ekstensi .csv dan .json
        </p>
        <input 
          type="file" 
          accept=".csv, application/json" 
          onChange={handleFileChange}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
        />
      </div>

      {uploadStatus && (
        <div style={{ 
          padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px',
          backgroundColor: uploadStatus.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          color: uploadStatus.type === 'success' ? '#065F46' : '#991B1B',
          border: `1px solid ${uploadStatus.type === 'success' ? '#A7F3D0' : '#FECACA'}`
        }}>
          {uploadStatus.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span style={{ fontSize: '14px' }}>{uploadStatus.message}</span>
        </div>
      )}

      <button 
        onClick={handleUpload}
        disabled={!file || !selectedFarm || isUploading}
        style={{
          width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
          backgroundColor: (!file || !selectedFarm || isUploading) ? '#9CA3AF' : '#116a3a',
          color: '#fff', fontSize: '14px', fontWeight: '600', cursor: (!file || !selectedFarm || isUploading) ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
        }}
      >
        {isUploading ? <><Loader2 size={16} className="animate-spin" /> Memproses...</> : 'Proses Data ML'}
      </button>
    </div>
  );
};

export default AdminGISUploader;
