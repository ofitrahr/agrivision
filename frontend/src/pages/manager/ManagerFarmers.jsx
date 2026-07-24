import React, { useEffect, useState, useRef } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';

const ManagerFarmers = () => {
    const [farmers, setFarmers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);
    
    // State untuk form tambah petani
    const [formData, setFormData] = useState({ 
        name: '', phone: '', photo: null,
        gender: 'Laki-laki', age: '', join_year: '', farm_info: ''
    });
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('phone', formData.phone);
            data.append('gender', formData.gender);
            data.append('age', formData.age);
            data.append('join_year', formData.join_year);
            data.append('farm_info', formData.farm_info);
            if (formData.photo) {
                data.append('photo', formData.photo);
            }

            const response = await api.post('/manager/farmers', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                alert('Petani berhasil ditambahkan!');
                setFormData({ name: '', phone: '', photo: null, gender: 'Laki-laki', age: '', join_year: '', farm_info: '' });
                if (fileInputRef.current) fileInputRef.current.value = "";
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
                <button className="action-btn view-btn" onClick={() => navigate('/manager/dashboard')}> Kembali ke Dashboard</button>
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
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Nama Lengkap *</label>
                                <input type="text" style={{ width: '100%', padding: '8px' }} required 
                                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>No. HP</label>
                                <input type="text" style={{ width: '100%', padding: '8px' }} 
                                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Gender</label>
                                <select style={{ width: '100%', padding: '8px' }}
                                    value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                                    <option value="Laki-laki">Laki-laki</option>
                                    <option value="Perempuan">Perempuan</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Usia</label>
                                <input type="number" style={{ width: '100%', padding: '8px' }}
                                    value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Tahun Bergabung</label>
                                <input type="number" style={{ width: '100%', padding: '8px' }}
                                    value={formData.join_year} onChange={e => setFormData({...formData, join_year: e.target.value})} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Foto Wajah</label>
                                <input type="file" accept="image/*" ref={fileInputRef} style={{ width: '100%', padding: '8px' }} 
                                    onChange={e => setFormData({...formData, photo: e.target.files[0]})} />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Info Pertanian Tambahan</label>
                                <textarea style={{ width: '100%', padding: '8px', minHeight: '60px' }}
                                    value={formData.farm_info} onChange={e => setFormData({...formData, farm_info: e.target.value})} />
                            </div>
                            
                            <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                                <button type="submit" className="primary-btn" style={{ width: '100%' }} disabled={saving}>
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
                            ></button>
                            
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
