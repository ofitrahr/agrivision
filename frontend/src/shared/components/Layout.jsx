import React, { useContext, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../features/auth/AuthContext';

const Sidebar = ({ role, user }) => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const adminLinks = [
    { to: '/admin/dashboard', icon: 'dashboard', label: 'Platform Overview' },
    { to: '/admin/companies', icon: 'business', label: 'Daftar Klien' },
    { to: '/admin/gis', icon: 'map', label: 'GIS & Pemetaan' },
    { to: '/admin/traceability', icon: 'qr_code_scanner', label: 'Traceability' },
  ];

  const managerLinks = [
    { to: '/manager/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { to: '/manager/farmers', icon: 'group', label: 'Data Petani' },
    { to: '/manager/farm-management', icon: 'landscape', label: 'Manajemen Lahan' },
    { to: '/manager/economics', icon: 'payments', label: 'Ekonomi' },
    { to: '/manager/traceability', icon: 'verified', label: 'Traceability' },
  ];
  
  const boardLinks = [
    { to: '/board/dashboard', icon: 'analytics', label: 'Dashboard Eksekutif' },
  ];

  let links = [];
  if (role === 'super_admin') links = adminLinks;
  else if (role === 'manager') links = managerLinks;
  else if (role === 'board') links = boardLinks;

  const roleLabel = role === 'super_admin' ? 'Super Admin' : (role === 'manager' ? 'Manager' : 'Board');

  const profilePath = role === 'super_admin'
    ? '/admin/profile'
    : role === 'manager'
      ? '/manager/profile-user'
      : '/board/profile';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <img src="/assets/images/logo_icon.png" alt="Agrivision Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div className="sidebar-brand-name">Agrivision</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu Utama</div>
          {links.map((link) => (
            <NavLink 
              key={link.to} 
              to={link.to} 
              className={({isActive}) => isActive ? 'sidebar-nav-item active' : 'sidebar-nav-item'}
            >
              <span className="material-symbols-outlined">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {(user?.full_name || user?.user || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name">{user?.full_name || user?.user || 'Pengguna'}</div>
              <div className="sidebar-user-role">{roleLabel}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="sidebar-footer-btn" onClick={() => navigate(profilePath)} title="Profil">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
              Profil
            </button>
            <button className="sidebar-footer-btn sidebar-footer-btn-danger" onClick={() => setShowLogoutConfirm(true)} title="Keluar">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {showLogoutConfirm && (
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
              <button className="btn btn-ghost" onClick={() => setShowLogoutConfirm(false)}>Batal</button>
              <button className="btn btn-primary" style={{ background: 'var(--color-error)' }} onClick={handleLogout}>Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="topnav">
        <div className="search-input-wrap">
          <span className="material-symbols-outlined">search</span>
          <input type="text" className="search-input" placeholder="Cari data..." aria-label="Pencarian global" />
        </div>
        <div className="topnav-actions">
          <button className="topnav-icon-btn" title="Notifikasi" aria-label="Notifikasi">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="topnav-icon-btn" title="Pengaturan" aria-label="Pengaturan">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="topnav-avatar" onClick={() => setShowLogoutModal(true)} title="Logout">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 16px 0', color: 'var(--color-primary-container)', fontSize: '20px' }}>Konfirmasi Keluar</h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--color-text-muted)' }}>Apakah Anda yakin ingin keluar dari sesi ini?</p>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setShowLogoutModal(false)}>Batal</button>
              <button className="btn btn-primary" style={{ background: 'var(--color-error)' }} onClick={handleLogout}>Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Layout = () => {
  const { user } = useContext(AuthContext);
  
  return (
    <div className="app-layout">
      <Sidebar role={user?.role || 'guest'} user={user} />
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
