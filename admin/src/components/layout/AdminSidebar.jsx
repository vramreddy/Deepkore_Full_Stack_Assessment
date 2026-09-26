import { NavLink } from 'react-router-dom';
import {
  FiGrid,
  FiUsers,
  FiFolder,
  FiFileText,
  FiExternalLink,
  FiDatabase,
  FiLock,
  FiX,
} from 'react-icons/fi';

function AdminSidebar({ isOpen, onClose }) {
  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Mobile-only header inside drawer */}
      <div className="admin-sidebar-mobile-header">
        <div className="admin-brand-mini">
          <img src="/deepkore-icon.png" alt="Deepkore" className="admin-brand-logo" />
          <span className="admin-brand-title">Deepkore <span>Admin</span></span>
        </div>
        <button
          type="button"
          className="admin-sidebar-close-btn"
          onClick={onClose}
          aria-label="Close navigation sidebar"
        >
          <FiX size={20} />
        </button>
      </div>

      <div className="admin-sidebar-section">
        <span className="sidebar-section-heading">GOVERNANCE & CONTROL</span>
        <nav className="admin-nav-list">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <FiGrid className="nav-icon" />
            <span>Admin Overview</span>
          </NavLink>

          <NavLink
            to="/users"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <FiUsers className="nav-icon" />
            <span>User Management</span>
          </NavLink>

          <NavLink
            to="/projects"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <FiFolder className="nav-icon" />
            <span>Projects Oversight</span>
          </NavLink>

          <NavLink
            to="/audit"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <FiFileText className="nav-icon" />
            <span>Global Audit Logs</span>
          </NavLink>
        </nav>
      </div>

      <div className="admin-sidebar-section">
        <span className="sidebar-section-heading">ENVIRONMENT & ARCHITECTURE</span>
        <div className="admin-system-info-container">
          <div className="system-status-block">
            <div className="status-block-header">
              <FiDatabase className="status-block-icon green" />
              <span className="status-block-label">MongoDB Data Store</span>
            </div>
            <div className="status-block-footer">
              <span className="status-block-sub">Document Database</span>
              <span className="status-pill green">
                <span className="status-dot green"></span>
                Healthy
              </span>
            </div>
          </div>

          <div className="system-status-block">
            <div className="status-block-header">
              <FiLock className="status-block-icon blue" />
              <span className="status-block-label">Role-Based Access</span>
            </div>
            <div className="status-block-footer">
              <span className="status-block-sub">RBAC Protection</span>
              <span className="status-pill blue">
                <span className="status-dot blue"></span>
                Strict
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-sidebar-footer">
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          className="portal-switch-card"
        >
          <div className="switch-text">
            <strong>Employee / Manager Portal</strong>
            <span>Switch to daily work operations</span>
          </div>
          <FiExternalLink size={16} />
        </a>
      </div>
    </aside>
  );
}

export default AdminSidebar;
