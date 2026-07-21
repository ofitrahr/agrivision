import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../../shared/api/axios';
import './Login.css'; 

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);
      if (response.data.success) {
        // Simpan token JWT dan data user ke browser lokal
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal tersambung ke server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-glass-card">
        <div className="login-header">
          <h1>Agrivision</h1>
          <p>{t('login')} untuk mengelola sistem</p>
        </div>
        
        {error && <div className="login-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="login-form-group">
            <label>Username</label>
            <input 
              type="text" 
              name="username"
              className="login-input" 
              placeholder="Contoh: superadmin"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="login-form-group">
            <label>Password</label>
            <input 
              type="password" 
              name="password"
              className="login-input" 
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Memproses...' : t('login')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
