import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../shared/api/axios';

const initialFormData = {
    name: '',
    description: '',
    commodity: '',
    location: ''
};

const ProjectList = () => {
    const { companyId } = useParams();
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        fetchProjects();
    }, [companyId]);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/companies/${companyId}/projects`);
            if (response.data.success) {
                setProjects(response.data.data);
            }
        } catch (error) {
            console.error('Gagal mengambil data project', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddProject = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/admin/companies/${companyId}/projects`, formData);
            setIsModalOpen(false);
            setFormData(initialFormData);
            fetchProjects();
        } catch (error) {
            alert(error.response?.data?.message || 'Terjadi kesalahan!');
        }
    };

    if (loading) return <div style={{ padding: '30px' }}>Memuat daftar project...</div>;

    return (
        <div style={{ padding: '30px' }}>
            <div style={{ marginBottom: '30px', display: 'flex', gap: '15px' }}>
                <button className="action-btn view-btn" onClick={() => navigate('/admin/companies')}> Kembali ke Daftar Company</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ color: '#1B4332', margin: 0 }}>Kelola Project</h1>
                <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
                    + Tambah Project
                </button>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nama Project</th>
                            <th>Deskripsi</th>
                            <th>Commodity</th>
                            <th>Lokasi</th>
                            <th>Tanggal Dibuat</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                                    Belum ada project di company ini.
                                </td>
                            </tr>
                        ) : (
                            projects.map((p) => (
                                <tr key={p.id}>
                                    <td style={{ fontWeight: '600' }}>{p.name}</td>
                                    <td>{p.description || '-'}</td>
                                    <td>{p.commodity || '-'}</td>
                                    <td>{p.location || '-'}</td>
                                    <td>{new Date(p.created_at).toLocaleDateString('id-ID')}</td>
                                    <td>
                                        <button className="action-btn primary-btn" onClick={() => navigate(`/admin/projects/${p.id}/permissions`)} style={{ padding: '6px 12px', fontSize: '12px' }}>Modul SaaS</button>
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
                            <h2>Tambah Project Baru</h2>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleAddProject}>
                            <div className="form-group">
                                <label>Nama Project *</label>
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Deskripsi</label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" />
                            </div>
                            <div className="form-group">
                                <label>Commodity</label>
                                <input type="text" name="commodity" value={formData.commodity} onChange={handleInputChange} placeholder="Contoh: Coffee, Rice, Horticulture" />
                            </div>
                            <div className="form-group">
                                <label>Lokasi</label>
                                <input type="text" name="location" value={formData.location} onChange={handleInputChange} />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Batal</button>
                                <button type="submit" className="primary-btn">Simpan Project</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectList;
