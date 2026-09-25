import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiHome,
  FiFolder,
  FiCheckSquare,
  FiActivity,
  FiLogOut,
  FiMenu,
  FiX,
  FiShield,
  FiBriefcase,
  FiUser,
} from 'react-icons/fi';
import { useState } from 'react';

function Sidebar() {
  const { user, logout, isAdmin, isManager, isEmployee } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    ...(isAdmin
      ? [{ to: '/admin', icon: <FiShield />, label: 'Admin Control Panel', highlight: true }]
      : []),
    {
      to: '/dashboard',
      icon: <FiHome />,
      label: isAdmin ? 'System Dashboard' : isManager ? 'Operations Dashboard' : 'My Workspace',
    },
    {
      to: '/projects',
      icon: <FiFolder />,
      label: isEmployee ? 'Assigned Projects' : 'Projects Catalog',
    },
    {
      to: '/tasks',
      icon: <FiCheckSquare />,
      label: isEmployee ? 'My Tasks Board' : 'Task Operations',
    },
    {
      to: '/activities',
      icon: <FiActivity />,
      label: 'Audit Trail',
    },
  ];

  const getPortalInfo = () => {
    if (isAdmin) {
      return {
        icon: <FiShield />,
        title: 'Admin Control Panel',
        colorClass: 'portal-badge-admin',
      };
    }
    if (isManager) {
      return {
        icon: <FiBriefcase />,
        title: 'Manager Console',
        colorClass: 'portal-badge-manager',
      };
    }
    return {
      icon: <FiUser />,
      title: 'Employee Portal',
      colorClass: 'portal-badge-employee',
    };
  };

  const portal = getPortalInfo();

  return (
    <>
      {/* Mobile toggle */}
      <button className="sidebar-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-logo">SmartOps</h2>
          <div className={`sidebar-portal-badge ${portal.colorClass}`}>
            <span className="portal-icon">{portal.icon}</span>
            <span>{portal.title}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${item.highlight ? 'sidebar-link-highlight' : ''}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
              {item.highlight && <span className="sidebar-pill-badge">ADMIN</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className="sidebar-user-role">{user?.role?.toUpperCase()}</span>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout} title="Logout">
            <FiLogOut />
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
