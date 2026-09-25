import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  FiUsers,
  FiFolder,
  FiCheckCircle,
  FiActivity,
  FiServer,
  FiDatabase,
  FiShield,
  FiExternalLink,
  FiUserPlus,
  FiClock,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

function AdminDashboardPage() {
  const { user } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, usersRes, actRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/auth/users'),
        api.get('/activities', { params: { limit: 8 } }),
      ]);

      setStats(dashRes.data);
      setUsers(usersRes.data.users || []);
      setActivities(actRes.data.activities || []);
    } catch (err) {
      toast.error('Failed to load administrative telemetry.');
    } finally {
      setLoading(false);
    }
  };

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const managerCount = users.filter((u) => u.role === 'manager').length;
  const employeeCount = users.filter((u) => u.role === 'employee').length;

  if (loading) {
    return (
      <div className="admin-page-loader">
        <div className="admin-spinner"></div>
        <p>Loading System Intelligence & Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="admin-content-view">
      {/* Top Banner */}
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">ENTERPRISE SYSTEM TELEMETRY</span>
          <h1 className="admin-title">System Governance Dashboard</h1>
          <p className="admin-subtitle">
            Welcome, {user?.name}. Real-time monitoring across user directory, workloads, and system security.
          </p>
        </div>

        <div className="admin-header-actions">
          <Link to="/users" className="admin-btn admin-btn-primary">
            <FiUserPlus /> Manage Users
          </Link>
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn admin-btn-secondary"
          >
            <FiExternalLink /> Open Operations Portal
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="admin-metrics-grid">
        <div className="admin-metric-card">
          <div className="metric-icon-wrap blue">
            <FiUsers />
          </div>
          <div className="metric-content">
            <span className="metric-label">Total System Users</span>
            <div className="metric-value">{users.length}</div>
            <div className="metric-subtext">
              <span>{adminCount} Admins</span> • <span>{managerCount} Managers</span> • <span>{employeeCount} Employees</span>
            </div>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="metric-icon-wrap purple">
            <FiFolder />
          </div>
          <div className="metric-content">
            <span className="metric-label">Corporate Projects</span>
            <div className="metric-value">{stats?.totalProjects ?? 0}</div>
            <div className="metric-subtext">
              <span>Active Workflows in Progress</span>
            </div>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="metric-icon-wrap green">
            <FiCheckCircle />
          </div>
          <div className="metric-content">
            <span className="metric-label">Tracked Operations Tasks</span>
            <div className="metric-value">{stats?.totalTasks ?? 0}</div>
            <div className="metric-subtext">
              <span>{stats?.completedTasks ?? 0} completed</span>
            </div>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="metric-icon-wrap amber">
            <FiActivity />
          </div>
          <div className="metric-content">
            <span className="metric-label">Security Audit Events</span>
            <div className="metric-value">{activities.length}+</div>
            <div className="metric-subtext">
              <span>Immutable activity logs recorded</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Split: System Infrastructure & Role Distribution */}
      <div className="admin-split-grid">
        <div className="admin-panel-card">
          <div className="admin-card-header">
            <h3><FiServer className="card-header-icon" /> Infrastructure & Security Architecture</h3>
            <span className="badge-pill online">Healthy</span>
          </div>
          <div className="admin-system-table">
            <div className="system-row">
              <span className="sys-key">Backend API Service</span>
              <span className="sys-val mono">Express 4.x / Node.js (Port 5000)</span>
            </div>
            <div className="system-row">
              <span className="sys-key">Operations Frontend</span>
              <span className="sys-val mono">React 19 / Vite (Port 5173)</span>
            </div>
            <div className="system-row">
              <span className="sys-key">Admin Command Center</span>
              <span className="sys-val mono">React 19 / Vite (Port 5174)</span>
            </div>
            <div className="system-row">
              <span className="sys-key">Primary Database</span>
              <span className="sys-val mono">MongoDB Cluster (Active Connection)</span>
            </div>
            <div className="system-row">
              <span className="sys-key">Authentication Engine</span>
              <span className="sys-val mono">JSON Web Token (JWT) + BCrypt (Salt 12)</span>
            </div>
            <div className="system-row">
              <span className="sys-key">Access Control Model</span>
              <span className="sys-val mono">Strict Role-Based Access Control (RBAC)</span>
            </div>
          </div>
        </div>

        <div className="admin-panel-card">
          <div className="admin-card-header">
            <h3><FiShield className="card-header-icon" /> Organizational Role Breakdown</h3>
            <Link to="/users" className="card-link">View Directory &rarr;</Link>
          </div>
          <div className="admin-role-breakdown">
            <div className="role-stat-item">
              <div className="role-header">
                <span className="role-name admin">System Administrators</span>
                <span className="role-count">{adminCount} accounts</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill admin"
                  style={{ width: `${users.length ? (adminCount / users.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="role-stat-item">
              <div className="role-header">
                <span className="role-name manager">Project Managers</span>
                <span className="role-count">{managerCount} accounts</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill manager"
                  style={{ width: `${users.length ? (managerCount / users.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="role-stat-item">
              <div className="role-header">
                <span className="role-name employee">Operations Employees</span>
                <span className="role-count">{employeeCount} accounts</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill employee"
                  style={{ width: `${users.length ? (employeeCount / users.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Global Activity Audit Feed */}
      <div className="admin-panel-card" style={{ marginTop: '1.5rem' }}>
        <div className="admin-card-header">
          <h3><FiActivity className="card-header-icon" /> Recent System Audit Records</h3>
          <Link to="/audit" className="card-link">View All Audit Logs &rarr;</Link>
        </div>

        {activities.length === 0 ? (
          <p className="empty-text">No activity records logged yet.</p>
        ) : (
          <div className="admin-audit-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor / User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Audit Details</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((act) => (
                  <tr key={act._id}>
                    <td className="mono muted">
                      {new Date(act.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <strong>{act.user?.name || 'System'}</strong>
                      <span className="user-email-micro">{act.user?.email}</span>
                    </td>
                    <td>
                      <span className="audit-action-tag">{act.action}</span>
                    </td>
                    <td>
                      <span className="entity-tag">{act.entityType}: {act.entityName || '—'}</span>
                    </td>
                    <td className="details-text">{act.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboardPage;
