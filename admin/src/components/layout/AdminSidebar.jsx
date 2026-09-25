import { NavLink } from 'react-router-dom';
import {
  FiGrid,
  FiUsers,
  FiFolder,
  FiFileText,
  FiExternalLink,
  FiDatabase,
  FiLock,
} from 'react-icons/fi';

function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-section">
        <span className="sidebar-section-heading">GOVERNANCE & CONTROL</span>
        <nav className="admin-nav-list">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <FiGrid className="nav-icon" />
            <span>Admin Overview</span>
          </NavLink>

          <NavLink
            to="/users"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <FiUsers className="nav-icon" />
            <span>User Management</span>
          </NavLink>

          <NavLink
            to="/projects"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <FiFolder className="nav-icon" />
            <span>Projects Oversight</span>
          </NavLink>

          <NavLink
            to="/audit"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <FiFileText className="nav-icon" />
            <span>Global Audit Logs</span>
          </NavLink>
        </nav>
      </div>

      <div className="admin-sidebar-section">
        <span className="sidebar-section-heading">ENVIRONMENT</span>
        <div className="admin-system-info-card">
          <div className="info-row">
            <FiDatabase size={14} className="info-icon" />
            <span>MongoDB Data Store</span>
            <span className="info-badge green">Healthy</span>
          </div>
          <div className="info-row">
            <FiLock size={14} className="info-icon" />
            <span>Role-Based Access</span>
            <span className="info-badge blue">Strict</span>
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
