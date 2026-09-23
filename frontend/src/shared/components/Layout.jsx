import { useContext, useState, useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../features/auth/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { getStoredSettings, syncSettingsFromServer } from '../utils/settingsHelper';

const Sidebar = ({ role, user, onToggleSidebar }) => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const { t } = useTranslation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const adminSections = [
    {
      label: t('section.mainMenu'),
      links: [
        { to: '/admin/dashboard', icon: 'dashboard', label: t('nav.platformOverview') },
        { to: '/admin/companies', icon: 'business', label: t('nav.clients') },
        { to: '/admin/gis', icon: 'map', label: t('nav.gis') },
        { to: '/admin/traceability', icon: 'qr_code_scanner', label: t('nav.traceability') },
        { to: '/admin/recent-activities', icon: 'campaign', label: t('nav.activities') },
      ],
    },
  ];

  const managerSections = [
    {
      label: t('section.fieldOps'),
      links: [
        { to: '/manager/dashboard', icon: 'dashboard', label: t('nav.dashboard') },
        { to: '/manager/farm-management', icon: 'landscape', label: t('nav.farmManagement') },
        { to: '/manager/farmers', icon: 'group', label: t('nav.farmers') },
      ],
    },
    {
      label: t('section.monitoring'),
      links: [
        { to: '/manager/agronomy', icon: 'eco', label: t('nav.agronomy') },
        { to: '/manager/economics', icon: 'payments', label: t('nav.economics') },
        { to: '/manager/traceability', icon: 'verified', label: t('nav.traceability') },
      ],
    },
  ];

  const boardSections = [
    {
      label: t('section.mainMenu'),
      links: [
        { to: '/board/dashboard', icon: 'analytics', label: t('nav.execDashboard') },
      ],
    },
  ];

  const sections = role === 'super_admin' ? adminSections : (role === 'manager' ? managerSections : boardSections);

  const roleLabel = t(`role.${role === 'super_admin' || role === 'manager' ? role : 'board'}`);

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
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flex: 1, minWidth: 0 }}>
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
          <div className="tooltip-wrapper">
            <button
              className="sidebar-collapse-btn"
              onClick={onToggleSidebar}
              aria-label={t('header.closeSidebar')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" className="panel-split-line" />
              </svg>
            </button>
            <div className="custom-tooltip custom-tooltip-bottom">
              <span>{t('header.closeSidebar')}</span>
            </div>
          </div>
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
                <div className="sidebar-user-name">{user?.full_name || user?.user || t('common.user')}</div>
                <div className="sidebar-user-role">{roleLabel}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="sidebar-footer-btn" onClick={() => navigate(profilePath)} title={t('common.profile')}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
                {t('common.profile')}
              </button>
              <button className="sidebar-footer-btn sidebar-footer-btn-danger" onClick={() => setShowLogoutConfirm(true)} title={t('common.logout')}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                {t('common.logout')}
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
              {t('logoutConfirm.title')}
            </h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--color-text-muted)', fontSize: '14px' }}>
              {t('logoutConfirm.message')}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setShowLogoutConfirm(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" style={{ background: 'var(--color-error)' }} onClick={handleLogout}>{t('logoutConfirm.yes')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ROLE_NOTIF_ENDPOINTS = {
  super_admin: '/admin/activities?limit=5',
  manager: '/manager/activities?limit=5',
};

const Header = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [notifInApp, setNotifInApp] = useState(() => getStoredSettings().notifInApp);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Lonceng mati jika notifInApp dimatikan di Settings
  const notifEndpoint = notifInApp ? ROLE_NOTIF_ENDPOINTS[user?.role] : undefined;

  useEffect(() => {
    const handleUpdate = () => setNotifInApp(getStoredSettings().notifInApp);
    window.addEventListener('settingsUpdated', handleUpdate);
    return () => window.removeEventListener('settingsUpdated', handleUpdate);
  }, []);

  const fetchNotifications = async () => {
    if (!notifEndpoint) return;
    setNotifLoading(true);
    setNotifError(null);
    try {
      const res = await api.get(notifEndpoint);
      setNotifications(res.data?.data ?? []);
    } catch {
      setNotifError(t('notif.error'));
    } finally {
      setNotifLoading(false);
    }
  };

  // Muat sekali saat mount supaya titik di tombol lonceng sudah akurat sebelum dropdown dibuka
  useEffect(() => {
    if (!notifEndpoint) return;
    api.get(notifEndpoint)
      .then(res => setNotifications(res.data?.data ?? []))
      .catch(() => {});
  }, [notifEndpoint]);

  const toggleNotifications = () => {
    if (!showNotifications) fetchNotifications();
    setShowNotifications(!showNotifications);
  };

  const notifButtonRef = useRef(null);
  const notifDropdownRef = useRef(null);

  useEffect(() => {
    if (!showNotifications) return;

    const handleClickOutside = (event) => {
      if (
        notifDropdownRef.current && !notifDropdownRef.current.contains(event.target) &&
        notifButtonRef.current && !notifButtonRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const ROLE_HISTORY_PATHS = {
    super_admin: '/admin/activities',
    manager: '/manager/activities',
  };

  const historyPath = ROLE_HISTORY_PATHS[user.role] ?? null;

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

  return (
    <>
      <header className="topnav">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {!isSidebarOpen && (
            <div className="tooltip-wrapper">
              <button
                className="topnav-toggle-btn"
                onClick={onToggleSidebar}
                aria-label={t('header.openSidebar')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M9 3v18" className="panel-split-line" />
                </svg>
              </button>
              <div className="custom-tooltip custom-tooltip-right">
                <span>{t('header.openSidebar')}</span>
              </div>
            </div>
          )}
        </div>
        <div className="topnav-actions" style={{ position: 'relative' }}>


          {/* Tombol Notifikasi */}
          {user?.role !== 'board' && notifInApp && (
            <button
              ref={notifButtonRef}
              className="topnav-icon-btn"
              title={t('header.notifications')}
              aria-label={t('header.notifications')}
              onClick={toggleNotifications}
              style={{ position: 'relative' }}
            >
              <span className="material-symbols-outlined">notifications</span>
              {notifications.length > 0 && (
                <span style={{
                  position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px',
                  borderRadius: '50%', background: 'var(--color-main-gold)'
                }} />
              )}
            </button>
          )}

          {/* Tombol Histori Aktivitas */}
          {user?.role !== 'board' &&
            <button
              className="topnav-icon-btn"
              title={t('header.history')}
              aria-label={t('header.history')}
              onClick={() => navigate(historyPath)}
            >
              <span className="material-symbols-outlined">history</span>
            </button>
          }

          {/* Tombol Pengaturan */}
          <button
            className="topnav-icon-btn"
            title={t('header.settings')}
            aria-label={t('header.settings')}
            onClick={() => navigate(settingsPath)}
          >
            <span className="material-symbols-outlined">settings</span>
          </button>

          {/* Avatar User -> Ke Profil */}
          <div
            className="topnav-avatar"
            onClick={() => navigate(profilePath)}
            title={t('header.viewProfile')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {(user?.full_name || user?.user || user?.username || 'U').charAt(0).toUpperCase()}
          </div>
          {/* Dropdown Notifikasi */}
          { user?.role !== 'board' && notifInApp && showNotifications && (
            <div ref={notifDropdownRef} style={{
              position: 'absolute', top: '48px', right: '0', width: '320px',
              background: 'var(--color-surface-white)', border: '1px solid var(--color-border-muted)',
              borderRadius: 'var(--radius-md)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              zIndex: 100, overflow: 'hidden'
            }}>
              <div style={{
                padding: '12px 16px', borderBottom: '1px solid var(--color-border-muted)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-main)' }}>{t('header.notifications')}</span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>{t('notif.recent', { count: notifications.length })}</span>
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifLoading ? (
                  <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {t('notif.loading')}
                  </div>
                ) : notifError ? (
                  <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--color-error)' }}>
                    {notifError}
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {t('notif.empty')}
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{
                      padding: '12px 16px', borderBottom: '1px solid var(--color-surface-container-high)',
                      display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer',
                      transition: 'background var(--transition)'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-main-gold)', marginTop: '2px' }}>{n.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-main)' }}>{n.text}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{n.subtext}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ padding: '8px 16px', textAlign: 'center', background: 'var(--color-surface-container-low)' }}>
                <button
                  onClick={() => setShowNotifications(false)}
                  style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}
                >
                  {t('common.close')}
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

  // Tarik preferensi akun dari server (fallback ke localStorage jika offline)
  useEffect(() => {
    if (user) syncSettingsFromServer();
  }, [user]);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <div className={`app-layout ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <Sidebar role={user?.role || 'guest'} user={user} onToggleSidebar={toggleSidebar} />
      <main className="main-content">
        <Header onToggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} />
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
