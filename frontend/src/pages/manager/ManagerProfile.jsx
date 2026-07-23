import React, { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';

const ManagerProfile = () => {
    const [profile, setProfile] = useState({ name: '', description: '', address: '', logo_url: '' });
    const [logoFile, setLogoFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/manager/profile');
                if (response.data.success) {
                    setProfile(response.data.data);
                }
            } catch (error) {
                console.error("Gagal load profil", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Karena upload file, gunakan FormData bukan format JSON biasa
            const formData = new FormData();
            formData.append('name', profile.name);
            formData.append('description', profile.description || '');
            formData.append('address', profile.address || '');
            if (logoFile) {
                formData.append('logo', logoFile);
            }

            const response = await api.put('/manager/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert(response.data.message);
            if (response.data.logo_url) {
                setProfile(prev => ({ ...prev, logo_url: response.data.logo_url }));
                setLogoFile(null); // Reset logo picker
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal menyimpan profil');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{padding: '30px'}}>Memuat profil...</div>;

    const baseURL = "http://localhost:8000";

    return (
        <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px' }}>
                <button className="action-btn view-btn" onClick={() => navigate('/manager/dashboard')}>⬅ Kembali ke Dashboard</button>
            </div>
            
            <h1 style={{ color: '#1B4332' }}>Profil Perusahaan</h1>
            
            <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', gap: '30px', marginBottom: '20px' }}>
                        {/* Tampilan Logo */}
                        <div style={{ width: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#f3f4f6', overflow: 'hidden', border: '2px dashed #9ca3af', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                {profile.logo_url ? (
                                    <img src={`${baseURL}${profile.logo_url}`} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ color: '#9ca3af', fontSize: '14px' }}>No Logo</span>
                                )}
                            </div>
                            <label style={{ marginTop: '10px', fontSize: '14px', cursor: 'pointer', color: '#2D6A4F', fontWeight: 'bold' }}>
                                Ubah Logo
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setLogoFile(e.target.files[0])} />
                            </label>
                            {logoFile && <p style={{ fontSize: '12px', color: '#059669', margin: '5px 0 0 0', textAlign: 'center' }}>File terpilih:<br/>{logoFile.name}</p>}
                        </div>

                        {/* Input Data Profile */}
                        <div style={{ flex: 1 }}>
                            <div className="form-group">
                                <label>Nama Perusahaan *</label>
                                <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Deskripsi Singkat</label>
                                <textarea rows="3" value={profile.description || ''} onChange={e => setProfile({...profile, description: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Alamat Utama</label>
                                <textarea rows="2" value={profile.address || ''} onChange={e => setProfile({...profile, address: e.target.value})} />
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                        <button type="submit" className="primary-btn" disabled={saving}>
                            {saving ? 'Menyimpan...' : 'Simpan Profil'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManagerProfile;
