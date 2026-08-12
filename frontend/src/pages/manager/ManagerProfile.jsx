import React, { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';
import Card from '../../shared/components/UI/Card';

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
                setLogoFile(null);
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal menyimpan profil');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }} aria-busy="true">
            <div className="skeleton-text" style={{ width: '200px', height: '32px', margin: '0 auto' }}></div>
        </div>
    );

    const baseURL = "http://localhost:8000";
    const formatUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `${baseURL}${url}`;
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header className="page-header" style={{ marginBottom: 'var(--space-md)' }}>
                <div>
                    <h1 className="page-title">Profil Perusahaan</h1>
                    <p className="page-subtitle">Kelola informasi profil dan identitas perusahaan Anda.</p>
                </div>
                <div>
                    <button className="btn btn-ghost" onClick={() => navigate('/manager/dashboard')}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                        Kembali
                    </button>
                </div>
            </header>
            
            <Card>
                <form onSubmit={handleSubmit} style={{ padding: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)', flexDirection: 'row', flexWrap: 'wrap' }}>
                        
                        {/* Logo Upload Section */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px' }}>
                            <div style={{ 
                                width: '160px', height: '160px', borderRadius: 'var(--radius-md)', 
                                background: 'var(--color-surface-container-low)', overflow: 'hidden', 
                                border: '2px dashed var(--color-border-muted)', display: 'flex', 
                                justifyContent: 'center', alignItems: 'center', marginBottom: '16px' 
                            }}>
                                {profile.logo_url ? (
                                    <img src={formatUrl(profile.logo_url)} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (

                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: 500 }}>No Logo</span>
                                )}
                            </div>
                            <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>upload</span>
                                Unggah Logo
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setLogoFile(e.target.files[0])} />
                            </label>
                            {logoFile && (
                                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '8px 0 0 0', textAlign: 'center', wordBreak: 'break-all' }}>
                                    Terpilih: {logoFile.name}
                                </p>
                            )}
                        </div>

                        {/* Input Data Profile */}
                        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div>
                                <label className="form-label">Nama Perusahaan <span style={{color: 'var(--color-error)'}}>*</span></label>
                                <input 
                                    className="form-input" 
                                    type="text" 
                                    value={profile.name} 
                                    onChange={e => setProfile({...profile, name: e.target.value})} 
                                    required 
                                    placeholder="Masukkan nama perusahaan"
                                />
                            </div>
                            <div>
                                <label className="form-label">Deskripsi Singkat</label>
                                <textarea 
                                    className="form-input" 
                                    rows="4" 
                                    style={{ resize: 'vertical' }}
                                    value={profile.description || ''} 
                                    onChange={e => setProfile({...profile, description: e.target.value})} 
                                    placeholder="Tuliskan deskripsi singkat mengenai perusahaan"
                                />
                            </div>
                            <div>
                                <label className="form-label">Alamat Utama</label>
                                <textarea 
                                    className="form-input" 
                                    rows="3" 
                                    style={{ resize: 'vertical' }}
                                    value={profile.address || ''} 
                                    onChange={e => setProfile({...profile, address: e.target.value})} 
                                    placeholder="Alamat lengkap operasional"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--color-border-muted)' }}>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
                            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default ManagerProfile;
