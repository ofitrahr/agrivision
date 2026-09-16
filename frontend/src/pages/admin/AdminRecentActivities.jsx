import { useEffect, useState } from 'react';
import api from '../../shared/api/axios';

const AdminRecentActivities = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedId, setSelectedId] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);

    const initialForm = {
        title: '',
        description: '',
        activity_date: '',
        file: null,
        preview_url: ''
    };
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/recent-activities');
            if (response.data?.data) {
                setActivities(response.data.data);
            }
        } catch (error) {
            console.error("Gagal mengambil daftar aktivitas", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'description' && value.length > 200) return;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran file tidak boleh lebih dari 2MB');
            return;
        }
        setFormData({
            ...formData,
            file,
            preview_url: URL.createObjectURL(file)
        });
    };

    const openModal = (mode, activity = null) => {
        setModalMode(mode);
        if (mode === 'edit' && activity) {
            setSelectedId(activity.id);
            setFormData({
                title: activity.title,
                description: activity.description || '',
                activity_date: activity.activity_date ? activity.activity_date.split('T')[0] : '',
                file: null,
                preview_url: activity.image_path || ''
            });
        } else {
            setFormData(initialForm);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('activity_date', formData.activity_date);
            if (formData.file) {
                data.append('file', formData.file);
            }

            if (modalMode === 'add') {
                await api.post('/admin/recent-activities', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.put(`/admin/recent-activities/${selectedId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setIsModalOpen(false);
            fetchActivities();
        } catch (error) {
            alert(error.response?.data?.message || 'Terjadi kesalahan');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/admin/recent-activities/${id}`);
            setConfirmDialog(null);
            fetchActivities();
        } catch (error) {
            alert('Gagal menghapus aktivitas');
        }
    };

    const handleReorder = async (direction, index) => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === activities.length - 1) return;

        const newActivities = [...activities];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newActivities[index], newActivities[targetIndex]] = [newActivities[targetIndex], newActivities[index]];
        setActivities(newActivities);

        try {
            await api.put('/admin/recent-activities/reorder', {
                order: newActivities.map(a => a.id)
            });
        } catch (error) {
            alert('Gagal mengubah urutan');
            fetchActivities();
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '32px' }}>
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Kelola Aktivitas</h1>
                        <p className="page-subtitle">Kelola konten Recent Activities yang ditampilkan di halaman About.</p>
                    </div>
                </div>
                <div className="skeleton-text" style={{ height: '200px', borderRadius: '8px' }}></div>
            </div>
        );
    }

    return (
        <div style={{ padding: '32px' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Kelola Aktivitas</h1>
                    <p className="page-subtitle">Kelola konten Recent Activities yang ditampilkan di halaman About.</p>
                </div>
                <div>
                    <button className="btn btn-primary" onClick={() => openModal('add')}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                        Tambah Aktivitas
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Gambar</th>
                            <th>Judul</th>
                            <th>Deskripsi</th>
                            <th>Tanggal</th>
                            <th>Urutan</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activities.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                    Belum ada aktivitas. Klik "Tambah Aktivitas" untuk menambahkan.
                                </td>
                            </tr>
                        ) : (
                            activities.map((activity, index) => (
                                <tr key={activity.id}>
                                    <td>{index + 1}</td>
                                    <td>
                                        {activity.image_path ? (
                                            <img
                                                src={activity.image_path}
                                                alt={activity.title}
                                                style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                            />
                                        ) : (
                                            <span style={{ color: '#9ca3af', fontSize: '13px' }}>-</span>
                                        )}
                                    </td>
                                    <td style={{ fontWeight: '600' }}>{activity.title}</td>
                                    <td>
                                        {activity.description && activity.description.length > 50
                                            ? activity.description.substring(0, 50) + '...'
                                            : activity.description}
                                    </td>
                                    <td>
                                        {activity.activity_date
                                            ? new Date(activity.activity_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                            : '-'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button
                                                className="btn btn-ghost"
                                                style={{ padding: '4px', minWidth: 'auto' }}
                                                onClick={() => handleReorder('up', index)}
                                                disabled={index === 0}
                                                title="Pindah ke atas"
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_upward</span>
                                            </button>
                                            <button
                                                className="btn btn-ghost"
                                                style={{ padding: '4px', minWidth: 'auto' }}
                                                onClick={() => handleReorder('down', index)}
                                                disabled={index === activities.length - 1}
                                                title="Pindah ke bawah"
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_downward</span>
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="action-btn edit-btn" onClick={() => openModal('edit', activity)}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                                                Edit
                                            </button>
                                            <button
                                                className="action-btn delete-btn"
                                                onClick={() => setConfirmDialog({
                                                    message: `Apakah Anda yakin ingin menghapus aktivitas "${activity.title}"?`,
                                                    onConfirm: () => handleDelete(activity.id)
                                                })}
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{modalMode === 'add' ? 'Tambah Aktivitas' : 'Edit Aktivitas'}</h2>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Judul *</label>
                                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
                            </div>

                            <div className="form-group">
                                <label>Deskripsi * ({formData.description.length}/200)</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    required
                                    rows="3"
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border-muted)', fontFamily: 'inherit', fontSize: '14px', resize: 'vertical' }}
                                ></textarea>
                            </div>

                            <div className="form-group">
                                <label>Tanggal Kegiatan *</label>
                                <input type="date" name="activity_date" value={formData.activity_date} onChange={handleInputChange} required />
                            </div>

                            <div className="form-group">
                                <label>Gambar (Maks 2MB)</label>
                                <input type="file" accept="image/*" onChange={handleFileChange} />
                                {formData.preview_url && (
                                    <div style={{ marginTop: '10px' }}>
                                        <img
                                            src={formData.preview_url}
                                            alt="Preview"
                                            style={{ maxHeight: '200px', width: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="form-actions">
                                <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Batal</button>
                                <button type="submit" className="primary-btn">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {confirmDialog && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Konfirmasi</h2>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <p>{confirmDialog.message}</p>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="secondary-btn" onClick={() => setConfirmDialog(null)}>Batal</button>
                            <button type="button" className="primary-btn" style={{ backgroundColor: '#e11d48' }} onClick={confirmDialog.onConfirm}>Yakin</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRecentActivities;
