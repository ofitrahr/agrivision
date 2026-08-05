import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../features/auth/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (localStorage.getItem('token') && userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role === 'super_admin') {
        navigate('/admin/dashboard');
      } else if (parsedUser.role === 'manager') {
        navigate('/manager/dashboard');
      } else if (parsedUser.role === 'board') {
        navigate('/board/dashboard');
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.username, formData.password);

    if (result.success) {
      if (result.user.role === 'super_admin') {
        navigate('/admin/dashboard');
      } else if (result.user.role === 'manager') {
        navigate('/manager/dashboard');
      } else if (result.user.role === 'board') {
        navigate('/board/dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.message || 'Gagal login. Periksa kembali username dan password.');
    }
    setLoading(false);
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card-container">
        {/* Panel Kiri - Branding & Info */}
        <div className="login-left-panel">
          <div className="login-brand-header">
            <img
              src="/assets/images/logo_icon.png"
              alt="Agrivision Logo"
              style={{ width: '44px', height: '44px', objectFit: 'contain' }}
            />
            <div>
              <div className="login-brand-title">Agrivision</div>
              <div className="login-brand-subtitle">See. Regenerate. Prosper</div>
            </div>
          </div>

          <div className="login-tagline-box">
            <h2>
              Monitor Lahan,<br />
              Maksimalkan <span>Hasil.</span>
            </h2>
            <p>
              Platform manajemen lahan pertanian presisi berbasis satelit dengan analisis NDVI, karbon kredit, dan laporan otomatis.
            </p>
          </div>

          <div className="login-features-list">
            <div className="login-feature-item">
              <span className="material-symbols-outlined">satellite_alt</span>
              Monitoring lahan via satelit
            </div>
            <div className="login-feature-item">
              <span className="material-symbols-outlined">eco</span>
              Portofolio karbon terintegrasi
            </div>
            <div className="login-feature-item">
              <span className="material-symbols-outlined">analytics</span>
              Laporan analitik otomatis
            </div>
            <div className="login-feature-item">
              <span className="material-symbols-outlined">shield</span>
              Data aman & terenkripsi
            </div>
          </div>
        </div>

        {/* Panel Kanan - Form Login */}
        <div className="login-right-panel">
          {error && (
            <div className="login-error-alert">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username / Email</label>
              <div className="login-input-icon-wrap">
                <span className="material-symbols-outlined">person</span>
                <input
                  type="text"
                  id="username"
                  name="username"
                  className="form-input"
                  placeholder="Masukkan username Anda"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="login-input-icon-wrap">
                <span className="material-symbols-outlined">lock</span>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" className="primary-btn login-submit-btn" disabled={loading}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {loading ? 'autorenew' : 'login'}
              </span>
              {loading ? 'Memproses...' : 'Masuk ke Dashboard'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Butuh bantuan?{' '}
            <a
              href="mailto:support@agrivision.id"
              style={{ color: 'var(--color-primary-container)', fontWeight: 600 }}
            >
              Hubungi Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
