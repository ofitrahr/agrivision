import React, { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';

const CompanyList = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' atau 'edit'
    
    const initialForm = {
        name: '', description: '', address: '', subscription_plan: 'Starter',
        max_farms: 5, max_users: 10, branding_color: '#2D6A4F', is_active: true
    };
    const [formData, setFormData] = useState(initialForm);
    const [selectedId, setSelectedId] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/companies');
            if (response.data.success) {
                setCompanies(response.data.data);
            }
        } catch (error) {
            console.error("Gagal mengambil daftar company", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const openModal = (mode, company = null) => {
        setModalMode(mode);
        if (mode === 'edit' && company) {
            setSelectedId(company.id);
            setFormData({
                name: company.name,
                description: company.description || '',
                address: company.address || '',
                subscription_plan: company.subscription_plan,
                max_farms: company.max_farms,
                max_users: company.max_users,
                branding_color: company.branding_color || '#2D6A4F',
                is_active: company.is_active
            });
        } else {
            setFormData(initialForm);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'add') {
                await api.post('/admin/companies', formData);
            } else {
                await api.put(`/admin/companies/${selectedId}`, formData);
            }
            setIsModalOpen(false);
            fetchCompanies(); // Refresh data
        } catch (error) {
            alert(error.response?.data?.message || "Terjadi kesalahan!");
        }
    };

    if (loading) return <div style={{padding: '30px'}}>Memuat daftar company...</div>;

    return (
        <div style={{ padding: '30px' }}>
            <div style={{ marginBottom: '30px', display: 'flex', gap: '15px' }}>
                <button className="action-btn view-btn" onClick={() => navigate('/admin/dashboard')}>⬅ Kembali ke Dashboard</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ color: '#1B4332', margin: 0 }}>Manajemen Klien (Company)</h1>
                <button className="primary-btn" onClick={() => openModal('add')}>
                    + Tambah Company
                </button>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nama Company</th>
                            <th>Paket Layanan</th>
                            <th>Kuota Lahan</th>
                            <th>Kuota User</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {companies.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                                    Belum ada data company. Silakan tambahkan klien pertama Anda.
                                </td>
                            </tr>
                        ) : (
                            companies.map((company) => (
                                <tr key={company.id}>
                                    <td style={{ fontWeight: '600' }}>{company.name}</td>
                                    <td><span className="badge badge-info">{company.subscription_plan}</span></td>
                                    <td>{company.max_farms}</td>
                                    <td>{company.max_users}</td>
                                    <td>
                                        <span className={`badge ${company.is_active ? 'badge-success' : 'badge-neutral'}`}>
                                            {company.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td style={{ display: 'flex', gap: '8px' }}>
                                        <button className="action-btn edit-btn" onClick={() => openModal('edit', company)}>Edit</button>
                                        <button className="action-btn view-btn" onClick={() => navigate(`/admin/companies/${company.id}/users`)}>Users</button>
                                        <button className="action-btn primary-btn" onClick={() => navigate(`/admin/companies/${company.id}/permissions`)} style={{ padding: '6px 12px', fontSize: '12px' }}>Modul SaaS</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Tambah/Edit */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{modalMode === 'add' ? 'Tambah Company Baru' : 'Edit Company'}</h2>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nama Company *</label>
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Paket (Plan)</label>
                                    <select name="subscription_plan" value={formData.subscription_plan} onChange={handleInputChange}>
                                        <option value="Starter">Starter</option>
                                        <option value="Professional">Professional</option>
                                        <option value="Enterprise">Enterprise</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Warna Tema</label>
                                    <input type="color" name="branding_color" value={formData.branding_color} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Maksimal Lahan</label>
                                    <input type="number" name="max_farms" value={formData.max_farms} onChange={handleInputChange} />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Maksimal User</label>
                                    <input type="number" name="max_users" value={formData.max_users} onChange={handleInputChange} />
                                </div>
                            </div>
                            
                            {modalMode === 'edit' && (
                                <div className="form-group" style={{ marginTop: '10px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} style={{ width: 'auto' }} />
                                        Company Aktif (Bisa Login)
                                    </label>
                                </div>
                            )}

                            <div className="form-actions">
                                <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Batal</button>
                                <button type="submit" className="primary-btn">Simpan Data</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyList;
