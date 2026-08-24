import React, { useContext, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../features/auth/AuthContext';

const Sidebar = ({ role, user }) => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const adminSections = [
    {
      label: 'Menu Utama',
      links: [
        { to: '/admin/dashboard', icon: 'dashboard', label: 'Platform Overview' },
        { to: '/admin/companies', icon: 'business', label: 'Daftar Klien' },
        { to: '/admin/gis', icon: 'map', label: 'GIS & Pemetaan' },
        { to: '/admin/traceability', icon: 'qr_code_scanner', label: 'Traceability' },
        { to: '/admin/recent-activities', icon: 'campaign', label: 'Aktivitas' },
      ],
    },
  ];

  const managerSections = [
    {
      label: 'Operasional Lapangan',
      links: [
        { to: '/manager/dashboard', icon: 'dashboard', label: 'Dashboard' },
        { to: '/manager/farm-management', icon: 'landscape', label: 'Manajemen Lahan' },
        { to: '/manager/farmers', icon: 'group', label: 'Data Petani' },
      ],
    },
    {
      label: 'Monitoring & Analitik',
      links: [
        { to: '/manager/agronomy', icon: 'eco', label: 'Index Observasi' },
        { to: '/manager/economics', icon: 'payments', label: 'Ekonomi & Laporan' },
        { to: '/manager/traceability', icon: 'verified', label: 'Traceability' },
      ],
    },
  ];

  const boardSections = [
    {
      label: 'Menu Utama',
      links: [
        { to: '/board/dashboard', icon: 'analytics', label: 'Dashboard Eksekutif' },
      ],
    },
  ];

  const sections = role === 'super_admin' ? adminSections : (role === 'manager' ? managerSections : boardSections);

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
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img 
              src="/assets/images/logo_icon.png" 
              alt="Agrivision Logo" 
              className="sidebar-logo-icon" 
            />
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title">
                <span className="brand-agri">Agri</span><span className="brand-vision">vision</span>
              </span>
              <span className="sidebar-brand-tagline">See • Regenerate • Prosper</span>
            </div>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {sections.map((section, idx) => (
            <div key={idx} style={{ marginBottom: '16px' }}>
              <div className="sidebar-section-label">{section.label}</div>
              {section.links.map((link) => (
                <NavLink 
                  key={link.to} 
                  to={link.to} 
                  className={({isActive}) => isActive ? 'sidebar-nav-item active' : 'sidebar-nav-item'}
                >
                  <span className="material-symbols-outlined">{link.icon}</span>
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-card">
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

const Header = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const profilePath = user?.role === 'super_admin'
    ? '/admin/profile'
    : user?.role === 'manager'
      ? '/manager/profile-user'
      : '/board/profile';

  const settingsPath = user?.role === 'super_admin'
    ? '/admin/settings'
    : user?.role === 'manager'
      ? '/manager/settings'
      : '/board/settings';

  const mockNotifications = [
    { id: 1, title: 'Sistem Operasional Normal', time: 'Baru saja', icon: 'check_circle', color: '#10b981' },
    { id: 2, title: 'Pembaruan Data Lahan & Petani', time: '1 jam yang lalu', icon: 'landscape', color: '#3b82f6' },
    { id: 3, title: 'Laporan Traceability Siap', time: 'Hari ini', icon: 'verified', color: '#f59e0b' },
  ];

  return (
    <>
      <header className="topnav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            className="topnav-toggle-btn"
            onClick={onToggleSidebar}
            title={isSidebarOpen ? "Sembunyikan Sidebar" : "Tampilkan Sidebar"}
            aria-label="Toggle Sidebar"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="search-input-wrap">
            <span className="material-symbols-outlined">search</span>
            <input type="text" className="search-input" placeholder="Cari data..." aria-label="Pencarian global" />
          </div>
        </div>
        <div className="topnav-actions" style={{ position: 'relative' }}>


          {/* Tombol Notifikasi */}
          <button 
            className="topnav-icon-btn" 
            title="Notifikasi" 
            aria-label="Notifikasi"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ position: 'relative' }}
          >
            <span className="material-symbols-outlined">notifications</span>
            <span style={{
              position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px',
              borderRadius: '50%', background: 'var(--color-main-gold)'
            }} />
          </button>

          {/* Tombol Pengaturan */}
          <button 
            className="topnav-icon-btn" 
            title="Pengaturan Platform & Preferensi" 
            aria-label="Pengaturan"
            onClick={() => navigate(settingsPath)}
          >
            <span className="material-symbols-outlined">settings</span>
          </button>

          {/* Avatar User -> Ke Profil */}
          <div 
            className="topnav-avatar" 
            onClick={() => navigate(profilePath)} 
            title="Lihat Profil Akun"
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {(user?.full_name || user?.user || user?.username || 'U').charAt(0).toUpperCase()}
          </div>
          {/* Dropdown Notifikasi */}
          {showNotifications && (
            <div style={{
              position: 'absolute', top: '48px', right: '0', width: '320px',
              background: 'var(--color-surface-white)', border: '1px solid var(--color-border-muted)',
              borderRadius: 'var(--radius-md)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              zIndex: 100, overflow: 'hidden'
            }}>
              <div style={{
                padding: '12px 16px', borderBottom: '1px solid var(--color-border-muted)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-main)' }}>Notifikasi</span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>3 Baru</span>
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {mockNotifications.map(n => (
                  <div key={n.id} style={{
                    padding: '12px 16px', borderBottom: '1px solid var(--color-surface-container-high)',
                    display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer',
                    transition: 'background var(--transition)'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: n.color, marginTop: '2px' }}>{n.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-main)' }}>{n.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '8px 16px', textAlign: 'center', background: 'var(--color-surface-container-low)' }}>
                <button 
                  onClick={() => setShowNotifications(false)}
                  style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

const Layout = () => {
  const { user } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };
  
  return (
    <div className={`app-layout ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <Sidebar role={user?.role || 'guest'} user={user} />
      <Header onToggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
