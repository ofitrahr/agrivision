import { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { useParams, useNavigate } from 'react-router-dom';
import AlertModal from '../../shared/components/UI/AlertModal';

const CompanyPermissions = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [permissions, setPermissions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alertState, setAlertState] = useState({ isOpen: false, type: 'info', message: '' });
    const showAlert = (type, message) => setAlertState({ isOpen: true, type, message });
    const closeAlert = () => {
        // Setelah sukses simpan, kembali ke daftar klien
        if (alertState.type === 'success') navigate('/admin/companies');
        setAlertState(prev => ({ ...prev, isOpen: false }));
    };

    const fetchPermissions = async () => {
        try {
            const response = await api.get(`/admin/projects/${projectId}/permissions`);
            if (response.data.success) {
                setPermissions(response.data.data);
            }
        } catch (error) {
            showAlert('error', 'Gagal mengambil data perizinan modul');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, [projectId]);

    const handleToggle = (field) => {
        setPermissions(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await api.put(`/admin/projects/${projectId}/permissions`, permissions);
            if (response.data.success) {
                showAlert('success', 'Konfigurasi modul berhasil disimpan!');
            }
        } catch (error) {
            showAlert('error', 'Gagal menyimpan konfigurasi');
        } finally {
            setSaving(false);
        }
    };

    const alertModal = (
        <AlertModal
            isOpen={alertState.isOpen}
            onClose={closeAlert}
            type={alertState.type}
            message={alertState.message}
        />
    );

    // Gagal fetch membuat permissions null, jadi modal juga dirender di sini
    if (loading || !permissions) return (
        <div style={{ padding: '30px' }}>
            Memuat konfigurasi...
            {alertModal}
        </div>
    );

    const renderToggle = (label, field) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'white', borderRadius: '8px', marginBottom: '10px', border: '1px solid #e5e7eb' }}>
            <span style={{ fontWeight: '500', color: '#374151' }}>{label}</span>
            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={permissions[field]} onChange={() => handleToggle(field)} />
                <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: permissions[field] ? '#10b981' : '#ccc', transition: '.4s', borderRadius: '24px' }}>
                    <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: permissions[field] ? '30px' : '4px', bottom: '4px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                </span>
            </label>
        </div>
    );

    return (
        <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
            <button className="action-btn view-btn" onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                Kembali
            </button>
            <h1 style={{ color: '#1B4332' }}>Konfigurasi Modul & Langganan SaaS Project</h1>
            <p style={{ color: '#6b7280', marginBottom: '30px' }}>Atur fitur-fitur apa saja yang dapat diakses oleh manajer pada project ini.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                    <h3 style={{ color: '#1f2937', marginBottom: '15px' }}>Modul Dasar</h3>
                    {renderToggle('Modul Pemetaan (GIS)', 'module_gis')}
                    {renderToggle('Modul Traceability', 'module_traceability')}
                    {renderToggle('Modul Laporan Board', 'module_board_reports')}
                    {renderToggle('Modul Agronomi', 'module_agronomy')}
                </div>
                <div>
                    <h3 style={{ color: '#1f2937', marginBottom: '15px' }}>Fitur Langganan</h3>
                    {renderToggle('Indeks Kesehatan (NDVI)', 'can_access_ndvi')}
                    {renderToggle('Estimasi Karbon (SOC)', 'can_access_soc')}
                    {renderToggle('Prediksi Panen (Yield)', 'can_access_yield')}
                    {renderToggle('Biomassa Karbon', 'can_access_biomass')}
                    {renderToggle('Nutrisi Tanah (NPK)', 'can_access_soilnpk')}
                </div>
            </div>

            <div style={{ marginTop: '30px', textAlign: 'right' }}>
                <button className="primary-btn" onClick={handleSave} disabled={saving} style={{ padding: '12px 30px', fontSize: '16px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
                    {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                </button>
            </div>

            {alertModal}
        </div>
    );
};

export default CompanyPermissions;
