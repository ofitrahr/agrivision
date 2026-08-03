import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../shared/api/axios';
import { AuthContext } from '../../features/auth/AuthContext';
import Card from '../../shared/components/UI/Card';

const UserProfile = () => {
  const { user, updateUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [profile, setProfile] = useState({ full_name: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const roleLabel = user?.role === 'super_admin'
    ? 'Super Admin'
    : user?.role === 'manager'
      ? 'Manager'
      : 'Board';

  const dashboardPath = user?.role === 'super_admin'
    ? '/admin/dashboard'
    : user?.role === 'manager'
      ? '/manager/dashboard'
      : '/board/dashboard';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/profile');
        if (response.data.success) {
          setProfile({
            full_name: response.data.data.full_name || '',
            phone: response.data.data.phone || '',
          });
        }
      } catch (error) {
        console.error('Gagal memuat profil', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg({ type: '', text: '' });

    try {
      const response = await api.put('/auth/profile', {
        full_name: profile.full_name,
        phone: profile.phone,
      });

      if (response.data.success) {
        setProfileMsg({ type: 'success', text: 'Profil berhasil diperbarui.' });
        if (updateUser) {
          updateUser({ ...user, full_name: profile.full_name });
        }
      }
    } catch (error) {
      setProfileMsg({
        type: 'error',
        text: error.response?.data?.message || 'Gagal menyimpan profil.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (passwordData.new_password.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password baru minimal 6 karakter.' });
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordMsg({ type: 'error', text: 'Konfirmasi password tidak cocok.' });
      return;
    }

    setChangingPassword(true);
    try {
      const response = await api.put('/auth/profile/password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });

      if (response.data.success) {
        setPasswordMsg({ type: 'success', text: 'Password berhasil diubah.' });
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      }
    } catch (error) {
      setPasswordMsg({
        type: 'error',
        text: error.response?.data?.message || 'Gagal mengubah password.',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }} aria-busy="true">
        <div className="skeleton-text" style={{ width: '200px', height: '32px', margin: '0 auto' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <header className="page-header" style={{ marginBottom: 'var(--space-md)' }}>
        <div>
          <h1 className="page-title">Profil Akun</h1>
          <p className="page-subtitle">Kelola informasi akun dan keamanan Anda.</p>
        </div>
        <div>
          <button className="btn btn-ghost" onClick={() => navigate(dashboardPath)}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            Kembali
          </button>
        </div>
      </header>

      {/* Info Akun */}
      <Card style={{ marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: 'var(--space-md)' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'var(--color-primary-container)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: 700, flexShrink: 0,
          }}>
            {(user?.full_name || user?.user || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-main)' }}>
              {profile.full_name || user?.user || 'Pengguna'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              @{user?.user}
            </div>
            <span className="badge badge-info" style={{ marginTop: '8px' }}>{roleLabel}</span>
          </div>
        </div>
      </Card>

      {/* Edit Profil */}
      <Card title="Informasi Profil" style={{ marginBottom: 'var(--space-md)' }}>
        <form onSubmit={handleProfileSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="form-label">Username</label>
              <input
                className="form-input"
                type="text"
                value={user?.user || ''}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>
            <div>
              <label className="form-label">Nama Lengkap</label>
              <input
                className="form-input"
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div>
              <label className="form-label">No. Telepon</label>
              <input
                className="form-input"
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="Contoh: 08123456789"
              />
            </div>
          </div>

          {profileMsg.text && (
            <div style={{
              marginTop: '12px', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
              fontSize: '13px', fontWeight: 500,
              background: profileMsg.type === 'success' ? 'rgba(156,249,115,0.15)' : 'var(--color-error-container)',
              color: profileMsg.type === 'success' ? '#195200' : '#93000a',
            }}>
              {profileMsg.text}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border-muted)' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
              {saving ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </form>
      </Card>

      {/* Ubah Password */}
      <Card title="Ubah Password" style={{ marginBottom: 'var(--space-md)' }}>
        <form onSubmit={handlePasswordSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="form-label">Password Saat Ini</label>
              <input
                className="form-input"
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                placeholder="Masukkan password saat ini"
                required
              />
            </div>
            <div>
              <label className="form-label">Password Baru</label>
              <input
                className="form-input"
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                placeholder="Minimal 6 karakter"
                required
              />
            </div>
            <div>
              <label className="form-label">Konfirmasi Password Baru</label>
              <input
                className="form-input"
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                placeholder="Ulangi password baru"
                required
              />
            </div>
          </div>

          {passwordMsg.text && (
            <div style={{
              marginTop: '12px', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
              fontSize: '13px', fontWeight: 500,
              background: passwordMsg.type === 'success' ? 'rgba(156,249,115,0.15)' : 'var(--color-error-container)',
              color: passwordMsg.type === 'success' ? '#195200' : '#93000a',
            }}>
              {passwordMsg.text}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border-muted)' }}>
            <button type="submit" className="btn btn-primary" disabled={changingPassword}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lock_reset</span>
              {changingPassword ? 'Mengubah...' : 'Ubah Password'}
            </button>
          </div>
        </form>
      </Card>

      {/* Tombol Logout */}
      <Card style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-main)' }}>Keluar dari Akun</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Anda akan dikembalikan ke halaman login.
            </div>
          </div>
          <button
            className="btn btn-ghost"
            style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
            onClick={() => setShowLogoutModal(true)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
            Keluar
          </button>
        </div>
      </Card>

      {/* Modal Konfirmasi Logout */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ marginBottom: '16px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-error)' }}>logout</span>
            </div>
            <h2 style={{ margin: '0 0 8px 0', color: 'var(--color-text-main)', fontSize: '20px', fontFamily: 'var(--font-display)' }}>
              Konfirmasi Keluar
            </h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--color-text-muted)', fontSize: '14px' }}>
              Apakah Anda yakin ingin keluar dari sesi ini?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setShowLogoutModal(false)}>Batal</button>
              <button
                className="btn btn-primary"
                style={{ background: 'var(--color-error)' }}
                onClick={handleLogout}
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
