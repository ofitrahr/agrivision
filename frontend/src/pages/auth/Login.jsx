import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../../shared/api/axios';
import { AuthContext } from '../../features/auth/AuthContext';
import './Login.css'; 

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/admin/dashboard');
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
        } else {
            navigate('/dashboard'); // Atur nanti untuk manajer
        }
    } else {
        setError(result.message || 'Gagal login');
    }
    setLoading(false);
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
