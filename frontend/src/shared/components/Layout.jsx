import React, { useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../features/auth/AuthContext';
import { 
  LayoutDashboard, Users, Shield, Map, Activity, 
  Settings, LogOut, FileText, Bell, Search 
} from 'lucide-react';

const Sidebar = ({ role }) => {
  const adminLinks = [
    { to: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/admin/companies', icon: <Users size={20} />, label: 'Companies' },
    { to: '/admin/gis', icon: <Map size={20} />, label: 'Global GIS' },
    { to: '/admin/traceability', icon: <Activity size={20} />, label: 'Traceability' },
  ];

  const managerLinks = [
    { to: '/manager/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/manager/farmers', icon: <Users size={20} />, label: 'Farmers' },
    { to: '/manager/gis', icon: <Map size={20} />, label: 'GIS' },
    { to: '/manager/agronomy', icon: <FileText size={20} />, label: 'Agronomy' },
    { to: '/manager/economics', icon: <Activity size={20} />, label: 'Economics' },
    { to: '/manager/traceability', icon: <Shield size={20} />, label: 'Traceability' },
  ];
  
  const boardLinks = [
    { to: '/board/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  ];

  let links = [];
  if (role === 'super_admin') links = adminLinks;
  else if (role === 'manager') links = managerLinks;
  else if (role === 'board') links = boardLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-box">A</div>
        <h2 className="brand-name">Agrivision</h2>
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink 
            key={link.to} 
            to={link.to} 
            className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="nav-item" style={{cursor: 'pointer'}}>
          <Settings size={20} />
          <span>Settings</span>
        </div>
      </div>
    </aside>
  );
};

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="top-header">
        <div className="header-search">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Search projects, files, members..." />
        </div>
        <div className="header-right">
          <Bell size={20} className="icon-btn" />
          <div className="user-profile">
            <div className="user-info">
              <div className="user-name">{user?.username || 'User'}</div>
              <div className="user-role">{user?.role || 'Guest'}</div>
            </div>
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <LogOut size={20} className="icon-btn text-error" onClick={() => setShowLogoutModal(true)} title="Logout" />
          </div>
        </div>
      </header>

      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 16px 0', color: 'var(--text-main)', fontSize: '20px' }}>Konfirmasi Logout</h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)' }}>Apakah Anda yakin ingin keluar dari sesi ini?</p>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button className="secondary-btn" onClick={() => setShowLogoutModal(false)}>Batal</button>
              <button className="danger-btn" onClick={handleLogout}>Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Layout = () => {
  return (
    <div className="app-layout">
      <Sidebar role={JSON.parse(localStorage.getItem('user'))?.role || 'guest'} />
      <main className="main-content">
        <Header />
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
