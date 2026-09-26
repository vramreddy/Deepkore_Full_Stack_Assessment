import { useAdminAuth } from '../../context/AdminAuthContext';
import { FiLogOut, FiExternalLink, FiMenu, FiX } from 'react-icons/fi';

function AdminNavbar({ sidebarOpen, onToggleSidebar }) {
  const { user, logout } = useAdminAuth();

  return (
    <header className="admin-navbar">
      <div className="admin-navbar-left">
        {/* Mobile Hamburger Drawer Toggle Button */}
        <button
          type="button"
          className="admin-mobile-toggle"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
          title="Toggle Navigation Menu"
        >
          {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>

        <div className="admin-brand">
          <img
            src="/deepkore-icon.png"
            alt="Deepkore"
            className="admin-brand-logo"
            style={{ width: '36px', height: '36px', borderRadius: '10px' }}
          />
          <div className="admin-brand-text">
            <h1 className="admin-brand-title">Deepkore <span>Admin</span></h1>
            <span className="admin-brand-sub">Executive Operations &amp; Governance</span>
          </div>
        </div>

        <div className="admin-system-status">
          <span className="status-indicator-dot online"></span>
          <span className="status-text">Production: Online</span>
        </div>
      </div>

      <div className="admin-navbar-right">
        {/* Launcher to Manager / Employee Portal */}
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-portal-link"
          title="Open Employee & Manager Operations Portal (Port 5173)"
        >
          <span className="portal-text">Operations Portal</span>
          <FiExternalLink size={14} />
        </a>

        <div className="admin-user-pill">
          <div className="admin-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="admin-user-info">
            <span className="admin-user-name">{user?.name || 'Administrator'}</span>
            <span className="admin-badge">SUPER ADMIN</span>
          </div>
        </div>

        <button onClick={logout} className="admin-logout-btn" title="Sign Out">
          <FiLogOut size={16} />
          <span className="logout-text">Logout</span>
        </button>
      </div>
    </header>
  );
}

export default AdminNavbar;
