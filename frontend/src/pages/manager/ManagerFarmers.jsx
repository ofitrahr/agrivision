import React, { useEffect, useState, useRef } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Plus, Phone, Pencil, Trash2,
  X, Camera, AlertTriangle, UserCheck
} from 'lucide-react';

const ManagerFarmers = () => {
    const [farmers, setFarmers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [editId, setEditId] = useState(null);
    const fileInputRef = useRef(null);
    
    // Modal states
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [farmerToDelete, setFarmerToDelete] = useState(null);

    // Form data state
    const [formData, setFormData] = useState({ 
        name: '', phone: '', photo: null,
        gender: 'Laki-laki', age: '', join_year: '', farm_info: '',
        existingPhotoUrl: ''
    });

    const navigate = useNavigate();
    const baseURL = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/api\/?$/, '') : window.location.origin;

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

    const handleOpenAddModal = () => {
        setEditId(null);
        setFormData({
            name: '', phone: '', photo: null,
            gender: 'Laki-laki', age: '', join_year: '', farm_info: '',
            existingPhotoUrl: ''
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setEditModalOpen(true);
    };

    const handleOpenEditModal = (farmer) => {
        setEditId(farmer.id);
        setFormData({
            name: farmer.name || '',
            phone: farmer.phone || '',
            photo: null,
            gender: farmer.gender || 'Laki-laki',
            age: farmer.age || '',
            join_year: farmer.join_year || '',
            farm_info: farmer.farm_info || '',
            existingPhotoUrl: farmer.photo_url ? `${baseURL}${farmer.photo_url}` : ''
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setEditModalOpen(false);
        setEditId(null);
        setFormData({ name: '', phone: '', photo: null, gender: 'Laki-laki', age: '', join_year: '', farm_info: '', existingPhotoUrl: '' });
    };

    const handleOpenDeleteModal = (farmer) => {
        setFarmerToDelete(farmer);
        setDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setDeleteModalOpen(false);
        setFarmerToDelete(null);
    };

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

            const response = editId 
                ? await api.put(`/manager/farmers/${editId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
                : await api.post('/manager/farmers', data, { headers: { 'Content-Type': 'multipart/form-data' } });

            if (response.data.success) {
                handleCloseEditModal();
                fetchFarmers();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal menyimpan data pekerja');
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!farmerToDelete) return;
        setDeleting(true);
        try {
            const response = await api.delete(`/manager/farmers/${farmerToDelete.id}`);
            if (response.data.success) {
                setFarmers(farmers.filter(f => f.id !== farmerToDelete.id));
                handleCloseDeleteModal();
            }
        } catch (error) {
            alert('Gagal menghapus pekerja');
        } finally {
            setDeleting(false);
        }
    };

    if (loading && farmers.length === 0) return (
        <div style={{ padding: '50px', textAlign: 'center', color: '#6C757D' }}>
            Memuat daftar pekerja...
        </div>
    );

    return (
        <div>
            {/* Header Navigation & Page Title */}
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#6C757D', marginBottom: 8 }}>
                        <span>Dashboard</span>
                        <ChevronRight size={14} />
                        <span style={{ color: '#012d1d' }}>Data Petani</span>
                    </div>
                    <h1 className="page-title" style={{ margin: '0 0 8px 0' }}>Daftar Petani (Pekerja)</h1>
                    <p className="page-description">Kelola profil pekerja dan penugasan petani di kebun Anda.</p>
                </div>
                <div>
                    <button className="primary-btn" onClick={handleOpenAddModal} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={18} />
                        Tambah Pekerja Baru
                    </button>
                </div>
            </div>

            {/* Grid Petani */}
            {farmers.length === 0 ? (
                <div className="stat-card" style={{ padding: 48, textAlign: 'center' }}>
                    <p style={{ color: '#6C757D', fontSize: 16, margin: 0 }}>Belum ada data petani yang didaftarkan.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                    {farmers.map(farmer => (
                        <div key={farmer.id} className="stat-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Card Top: Avatar & Info */}
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                <div style={{
                                    width: 64, height: 64, borderRadius: '50%', overflow: 'hidden',
                                    flexShrink: 0, background: '#eaefec', border: '1px solid #E0EBE4'
                                }}>
                                    {farmer.photo_url ? (
                                        <img src={`${baseURL}${farmer.photo_url}`} alt={farmer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5C7A6D', fontSize: 24, fontWeight: 700 }}>
                                            {farmer.name ? farmer.name.charAt(0).toUpperCase() : 'P'}
                                        </div>
                                    )}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{ fontSize: 18, fontWeight: 600, color: '#012d1d', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {farmer.name}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#5C7A6D' }}>
                                        <Phone size={14} style={{ flexShrink: 0 }} />
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {farmer.phone || 'Tidak ada no. telp'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                                        <span style={{
                                            padding: '3px 12px', background: '#eaefec', color: '#053B26',
                                            borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em'
                                        }}>
                                            {farmer.gender ? farmer.gender.toUpperCase() : 'LAKI-LAKI'}
                                        </span>
                                        <span style={{
                                            padding: '3px 12px', background: '#eaefec', color: '#053B26',
                                            borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em'
                                        }}>
                                            {farmer.age ? `${farmer.age} TAHUN` : '- TAHUN'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Divider */}
                            <div style={{ borderTop: '1px solid #E0EBE4', marginTop: 4 }} />

                            {/* Card Bottom: Actions */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <button
                                    onClick={() => handleOpenEditModal(farmer)}
                                    className="farmer-card-action-btn edit-btn"
                                >
                                    <Pencil size={16} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleOpenDeleteModal(farmer)}
                                    className="farmer-card-action-btn delete-btn"
                                >
                                    <Trash2 size={16} />
                                    Hapus
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL EDIT / TAMBAH PEKERJA */}
            {editModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', padding: 16
                }}>
                    <div style={{
                        background: '#ffffff', borderRadius: 16, width: '100%',
                        maxWidth: 560, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '20px 24px', borderBottom: '1px solid #E0EBE4'
                        }}>
                            <h3 style={{ fontSize: 20, fontWeight: 600, color: '#012d1d', margin: 0 }}>
                                {editId ? 'Edit Data Pekerja' : 'Tambah Pekerja Baru'}
                            </h3>
                            <button onClick={handleCloseEditModal} className="modal-close-btn">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body / Form */}
                        <form onSubmit={handleSubmit}>
                            <div style={{ padding: 24 }}>
                                {/* Avatar Upload Section */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                                    <div
                                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                        style={{
                                            width: 96, height: 96, borderRadius: '50%', overflow: 'hidden',
                                            background: '#f0f5f2', border: '2px solid #E0EBE4',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', marginBottom: 12, position: 'relative'
                                        }}
                                    >
                                        {formData.photo ? (
                                            <img src={URL.createObjectURL(formData.photo)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : formData.existingPhotoUrl ? (
                                            <img src={formData.existingPhotoUrl} alt="Existing" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#5C7A6D' }}>
                                                <Camera size={28} />
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        onChange={e => setFormData({ ...formData, photo: e.target.files[0] })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                        className="avatar-change-btn"
                                    >
                                        <Camera size={14} />
                                        UBAH FOTO WAJAH
                                    </button>
                                </div>

                                {/* Form Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', marginBottom: 6 }}>
                                            Nama Lengkap *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            style={{
                                                width: '100%', padding: '10px 14px', border: '1px solid #E0EBE4',
                                                borderRadius: 8, fontSize: 14, color: '#191c1d', outline: 'none',
                                                boxSizing: 'border-box', fontFamily: 'inherit'
                                            }}
                                            placeholder="Masukkan nama lengkap"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', marginBottom: 6 }}>
                                            No. HP
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            style={{
                                                width: '100%', padding: '10px 14px', border: '1px solid #E0EBE4',
                                                borderRadius: 8, fontSize: 14, color: '#191c1d', outline: 'none',
                                                boxSizing: 'border-box', fontFamily: 'inherit'
                                            }}
                                            placeholder="0812-3456-7890"
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', marginBottom: 6 }}>
                                            Gender
                                        </label>
                                        <select
                                            value={formData.gender}
                                            onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                            style={{
                                                width: '100%', padding: '10px 14px', border: '1px solid #E0EBE4',
                                                borderRadius: 8, fontSize: 14, color: '#191c1d', outline: 'none',
                                                boxSizing: 'border-box', background: '#ffffff', fontFamily: 'inherit'
                                            }}
                                        >
                                            <option value="Laki-laki">Laki-laki</option>
                                            <option value="Perempuan">Perempuan</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', marginBottom: 6 }}>
                                            Usia
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.age}
                                            onChange={e => setFormData({ ...formData, age: e.target.value })}
                                            style={{
                                                width: '100%', padding: '10px 14px', border: '1px solid #E0EBE4',
                                                borderRadius: 8, fontSize: 14, color: '#191c1d', outline: 'none',
                                                boxSizing: 'border-box', fontFamily: 'inherit'
                                            }}
                                            placeholder="Contoh: 42"
                                        />
                                    </div>

                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', marginBottom: 6 }}>
                                            Tahun Bergabung
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.join_year}
                                            onChange={e => setFormData({ ...formData, join_year: e.target.value })}
                                            style={{
                                                width: '100%', padding: '10px 14px', border: '1px solid #E0EBE4',
                                                borderRadius: 8, fontSize: 14, color: '#191c1d', outline: 'none',
                                                boxSizing: 'border-box', fontFamily: 'inherit'
                                            }}
                                            placeholder="Contoh: 2018"
                                        />
                                    </div>

                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', marginBottom: 6 }}>
                                            Info Pertanian Tambahan
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={formData.farm_info}
                                            onChange={e => setFormData({ ...formData, farm_info: e.target.value })}
                                            style={{
                                                width: '100%', padding: '10px 14px', border: '1px solid #E0EBE4',
                                                borderRadius: 8, fontSize: 14, color: '#191c1d', outline: 'none',
                                                resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit'
                                            }}
                                            placeholder="Catatan tambahan mengenai petani..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div style={{
                                padding: '16px 24px', background: '#f6faf7',
                                borderTop: '1px solid #E0EBE4', display: 'flex',
                                justifyContent: 'flex-end', gap: 12
                            }}>
                                <button
                                    type="button"
                                    onClick={handleCloseEditModal}
                                    className="modal-btn-cancel"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="modal-btn-primary"
                                >
                                    {saving ? 'Menyimpan...' : (editId ? 'Update Pekerja' : 'Simpan Pekerja')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL HAPUS PEKERJA */}
            {deleteModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', padding: 16
                }}>
                    <div style={{
                        background: '#ffffff', borderRadius: 16, width: '100%',
                        maxWidth: 440, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '20px 24px', borderBottom: '1px solid #E0EBE4'
                        }}>
                            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#012d1d', margin: 0 }}>
                                Hapus Data Pekerja
                            </h3>
                            <button onClick={handleCloseDeleteModal} className="modal-close-btn">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: 24, textAlign: 'center' }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: '50%', background: '#ffdad6',
                                color: '#ba1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 16px'
                            }}>
                                <Trash2 size={26} />
                            </div>
                            <h4 style={{ fontSize: 18, fontWeight: 600, color: '#012d1d', margin: '0 0 8px 0' }}>
                                Konfirmasi Penghapusan
                            </h4>
                            <p style={{ fontSize: 14, color: '#5C7A6D', lineHeight: '22px', margin: 0 }}>
                                Apakah Anda yakin ingin menghapus data petani <strong>{farmerToDelete?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                            </p>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: '16px 24px', background: '#f6faf7',
                            borderTop: '1px solid #E0EBE4', display: 'flex',
                            justifyContent: 'flex-end', gap: 12
                        }}>
                            <button
                                type="button"
                                onClick={handleCloseDeleteModal}
                                className="modal-btn-cancel"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                                className="modal-btn-danger"
                            >
                                {deleting ? 'Menghapus...' : 'Hapus Pekerja'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerFarmers;
