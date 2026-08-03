import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../shared/api/axios';

const initialFormData = {
    project_id: '',
    username: '',
    full_name: '',
    phone: '',
    role: 'manager',
    password: ''
};

const CompanyUsers = () => {
    const { companyId } = useParams();
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [confirmDialog, setConfirmDialog] = useState(null);
    const [alertDialog, setAlertDialog] = useState(null);

    const [formData, setFormData] = useState(initialFormData);
    const [editFormData, setEditFormData] = useState({});

    useEffect(() => {
        fetchUsers();
        fetchProjects();
    }, [companyId]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/companies/${companyId}/users`);
            if (response.data.success) {
                setUsers(response.data.data);
            }
        } catch (error) {
            console.error('Gagal mengambil data user', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await api.get(`/admin/companies/${companyId}/projects`);
            if (response.data.success) {
                setProjects(response.data.data);
            }
        } catch (error) {
            console.error('Gagal mengambil daftar project', error);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEditInputChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/admin/companies/${companyId}/users`, formData);
            setIsModalOpen(false);
            setFormData(initialFormData);
            fetchUsers();
        } catch (error) {
            setAlertDialog({ message: error.response?.data?.message || 'Terjadi kesalahan!' });
        }
    };

    const confirmResetPassword = (userId, username) => {
        setConfirmDialog({
            message: `Yakin ingin reset password untuk user: ${username}?`,
            onConfirm: () => handleResetPassword(userId)
        });
    };

    const handleResetPassword = async (userId) => {
        setConfirmDialog(null);
        try {
            const response = await api.post(`/admin/users/${userId}/reset-password`, {});
            if (response.data.success) {
                setAlertDialog({
                    message: `Password berhasil direset!\n\nPassword Baru: ${response.data.data.new_password}\n\nSilakan catat password ini, karena tidak akan ditampilkan lagi.`
                });
            }
        } catch (error) {
            setAlertDialog({ message: error.response?.data?.message || 'Gagal mereset password' });
        }
    };

    const handleEditClick = (user) => {
        setEditFormData({
            id: user.id,
            project_id: user.project_id,
            username: user.username,
            full_name: user.full_name || '',
            phone: user.phone || '',
            role: user.role
        });
        setIsEditModalOpen(true);
    };

    const handleEditUser = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/admin/users/${editFormData.id}`, editFormData);
            setIsEditModalOpen(false);
            fetchUsers();
        } catch (error) {
            setAlertDialog({ message: error.response?.data?.message || 'Terjadi kesalahan saat mengedit user!' });
        }
    };

    const confirmDeleteUser = (userId, username) => {
        setConfirmDialog({
            message: `Yakin ingin menghapus user: ${username}?`,
            onConfirm: () => handleDeleteUser(userId)
        });
    };

    const handleDeleteUser = async (userId) => {
        setConfirmDialog(null);
        try {
            await api.delete(`/admin/users/${userId}`);
            fetchUsers();
        } catch (error) {
            setAlertDialog({ message: error.response?.data?.message || 'Gagal menghapus user' });
        }
    };

    if (loading) return <div style={{ padding: '30px' }}>Memuat daftar user...</div>;

    return (
        <div style={{ padding: '30px' }}>
            <div style={{ marginBottom: '30px', display: 'flex', gap: '15px' }}>
                <button className="action-btn view-btn" onClick={() => navigate('/admin/companies')}> Kembali ke Daftar Company</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ color: '#1B4332', margin: 0 }}>Kelola Akun Klien</h1>
                <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
                    + Tambah User
                </button>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Nama Lengkap</th>
                            <th>Project</th>
                            <th>No. HP</th>
                            <th>Role</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                                    Belum ada user di company ini.
                                </td>
                            </tr>
                        ) : (
                            users.map((u) => (
                                <tr key={u.id}>
                                    <td style={{ fontWeight: '600' }}>{u.username}</td>
                                    <td>{u.full_name || '-'}</td>
                                    <td>{u.project_name || '-'}</td>
                                    <td>{u.phone || '-'}</td>
                                    <td>
                                        <span className="badge badge-info">{u.role.toUpperCase()}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button
                                                className="action-btn view-btn"
                                                onClick={() => handleEditClick(u)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="action-btn edit-btn"
                                                onClick={() => confirmResetPassword(u.id, u.username)}
                                            >
                                                Reset Password
                                            </button>
                                            <button
                                                className="action-btn delete-btn"
                                                style={{ backgroundColor: '#e11d48', color: 'white' }}
                                                onClick={() => confirmDeleteUser(u.id, u.username)}
                                            >
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
                            <h2>Tambah Akun Baru</h2>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleAddUser}>
                            <div className="form-group">
                                <label>Project *</label>
                                <select name="project_id" value={formData.project_id} onChange={handleInputChange} required>
                                    <option value="">-- Pilih Project --</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Username *</label>
                                <input type="text" name="username" value={formData.username} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Nama Lengkap</label>
                                <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} />
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Role</label>
                                    <select name="role" value={formData.role} onChange={handleInputChange}>
                                        <option value="manager">Manager</option>
                                        <option value="board">Board (Eksekutif)</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>No. HP</label>
                                    <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Password Awal *</label>
                                <input
                                    type="password"
                                    name="password"
                                    minLength="8"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Batal</button>
                                <button type="submit" className="primary-btn">Simpan User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isEditModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Edit Akun</h2>
                            <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleEditUser}>
                            <div className="form-group">
                                <label>Project *</label>
                                <select name="project_id" value={editFormData.project_id} onChange={handleEditInputChange} required>
                                    <option value="">-- Pilih Project --</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Username *</label>
                                <input type="text" name="username" value={editFormData.username} onChange={handleEditInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Nama Lengkap</label>
                                <input type="text" name="full_name" value={editFormData.full_name} onChange={handleEditInputChange} />
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Role</label>
                                    <select name="role" value={editFormData.role} onChange={handleEditInputChange}>
                                        <option value="manager">Manager</option>
                                        <option value="board">Board (Eksekutif)</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>No. HP</label>
                                    <input type="text" name="phone" value={editFormData.phone} onChange={handleEditInputChange} />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="secondary-btn" onClick={() => setIsEditModalOpen(false)}>Batal</button>
                                <button type="submit" className="primary-btn">Simpan Perubahan</button>
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

            {alertDialog && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Informasi</h2>
                        </div>
                        <div style={{ marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
                            <p>{alertDialog.message}</p>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="primary-btn" onClick={() => setAlertDialog(null)}>Tutup</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyUsers;