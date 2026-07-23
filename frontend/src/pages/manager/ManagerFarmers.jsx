import React, { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';

const ManagerFarmers = () => {
    const [farmers, setFarmers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // State untuk form tambah petani
    const [newFarmer, setNewFarmer] = useState({ name: '', phone: '' });
    const [photoFile, setPhotoFile] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const navigate = useNavigate();
    const baseURL = "http://localhost:8000";

    const fetchFarmers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/manager/farmers');
            if (response.data.success) {
                setFarmers(response.data.data);
            }
        } catch (error) {
            console.error("Gagal load petani", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFarmers();
    }, []);

    const handleAddFarmer = async (e) => {
        e.preventDefault();
        setSaving(true);
        
        try {
            const formData = new FormData();
            formData.append('name', newFarmer.name);
            formData.append('phone', newFarmer.phone);
            if (photoFile) {
                formData.append('photo', photoFile);
            }

            const response = await api.post('/manager/farmers', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert(response.data.message);
            if (response.data.success) {
                setNewFarmer({ name: '', phone: '' });
                setPhotoFile(null);
                setShowForm(false);
                fetchFarmers(); // Refresh list
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal menambah petani');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Yakin ingin menghapus data pekerja ini?')) {
            try {
                const response = await api.delete(`/manager/farmers/${id}`);
                if (response.data.success) {
                    setFarmers(farmers.filter(f => f.id !== id));
                }
            } catch (error) {
                alert('Gagal menghapus pekerja');
            }
        }
    };

    if (loading && farmers.length === 0) return <div style={{padding: '30px'}}>Memuat daftar pekerja...</div>;

    return (
        <div style={{ padding: '30px' }}>
            <div style={{ marginBottom: '20px' }}>
                <button className="action-btn view-btn" onClick={() => navigate('/manager/dashboard')}>⬅ Kembali ke Dashboard</button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ color: '#1B4332' }}>Daftar Petani (Pekerja)</h1>
                <button className="primary-btn" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Batal Tambah' : '+ Tambah Pekerja Baru'}
                </button>
            </div>

            {/* Form Tambah Petani */}
            {showForm && (
                <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
                    <h3 style={{ marginTop: 0, color: '#374151' }}>Form Data Pekerja Baru</h3>
                    <form onSubmit={handleAddFarmer} style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ flex: '1', minWidth: '200px' }}>
                            <label>Nama Lengkap *</label>
                            <input type="text" value={newFarmer.name} onChange={e => setNewFarmer({...newFarmer, name: e.target.value})} required />
                        </div>
                        <div className="form-group" style={{ flex: '1', minWidth: '150px' }}>
                            <label>Nomor Telepon</label>
                            <input type="text" value={newFarmer.phone} onChange={e => setNewFarmer({...newFarmer, phone: e.target.value})} />
                        </div>
                        <div className="form-group" style={{ flex: '1', minWidth: '150px' }}>
                            <label>Pas Foto Wajah (Opsional)</label>
                            <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} style={{ padding: '8px 0' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '15px' }}>
                            <button type="submit" className="primary-btn" disabled={saving}>
                                {saving ? 'Menyimpan...' : 'Simpan Pekerja'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Grid / Tabel Petani */}
            {farmers.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '12px' }}>
                    <p style={{ color: '#6b7280' }}>Belum ada data petani yang didaftarkan.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                    {farmers.map(farmer => (
                        <div key={farmer.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                            <button 
                                onClick={() => handleDelete(farmer.id)}
                                style={{ position: 'absolute', top: '10px', right: '10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                title="Hapus Pekerja"
                            >✕</button>
                            
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#e5e7eb', marginBottom: '15px', overflow: 'hidden' }}>
                                {farmer.photo_url ? (
                                    <img src={`${baseURL}${farmer.photo_url}`} alt={farmer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '24px' }}>F</div>
                                )}
                            </div>
                            <h3 style={{ margin: '0 0 5px 0', color: '#1f2937' }}>{farmer.name}</h3>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>{farmer.phone || 'Tidak ada no. telp'}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManagerFarmers;
