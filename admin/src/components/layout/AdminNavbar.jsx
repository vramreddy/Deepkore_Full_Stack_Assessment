import { useAdminAuth } from '../../context/AdminAuthContext';
import { FiLogOut, FiExternalLink, FiShield, FiActivity, FiServer } from 'react-icons/fi';

function AdminNavbar() {
  const { user, logout } = useAdminAuth();

  return (
    <header className="admin-navbar">
      <div className="admin-navbar-left">
        <div className="admin-brand">
          <div className="admin-shield-icon">
            <FiShield size={20} />
          </div>
          <div>
            <h1 className="admin-brand-title">SmartOps <span>Admin</span></h1>
            <span className="admin-brand-sub">Executive Operations & Governance</span>
          </div>
        </div>

        <div className="admin-system-status">
          <span className="status-indicator-dot online"></span>
          <span className="status-text">Production Cluster: Online</span>
        </div>
      </div>

      <div className="admin-navbar-right">
        {/* Launcher to Manager / Employee Portal */}
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-portal-link"
          title="Open Employee & Manager Operations Portal"
        >
          <span>Operations Portal</span>
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
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}

export default AdminNavbar;
