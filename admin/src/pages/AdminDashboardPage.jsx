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
  FiArrowRight,
  FiX,
  FiLayers,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

function AdminDashboardPage() {
  const { user } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drilldown, setDrilldown] = useState(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setDrilldown(null);
    };
    if (drilldown) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drilldown]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, usersRes, actRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/auth/users'),
        api.get('/activities', { params: { limit: 10 } }),
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

  const totalProjects = stats?.projects?.total ?? stats?.totalProjects ?? 0;
  const activeProjects = stats?.projects?.active ?? 0;
  const totalTasks = stats?.tasks?.total ?? stats?.totalTasks ?? 0;
  const completedTasks = stats?.tasks?.completed ?? stats?.completedTasks ?? 0;
  const pendingTasks = stats?.tasks?.pending ?? 0;

  const openDrilldown = async (type) => {
    let title = '';
    let url = '';
    let count = 0;
    let isExternal = false;
    let color = 'blue';

    if (type === 'users') {
      title = 'Total System Users';
      url = '/users';
      count = users.length;
      color = 'blue';
      setDrilldown({
        type,
        title,
        url,
        count,
        color,
        isExternal: false,
        items: users,
      });
      return;
    } else if (type === 'projects') {
      title = 'Corporate Projects';
      url = '/projects';
      count = totalProjects;
      color = 'purple';
      const cached = stats?.drilldown?.totalProjects || [];
      setDrilldown({
        type,
        title,
        url,
        count,
        color,
        isExternal: false,
        items: cached,
      });
      if (cached.length === 0) {
        setDrilldownLoading(true);
        try {
          const res = await api.get('/projects?limit=30');
          setDrilldown((prev) => (prev ? { ...prev, items: res.data.projects || [] } : null));
        } catch (err) {
          console.error(err);
        } finally {
          setDrilldownLoading(false);
        }
      }
    } else if (type === 'tasks') {
      title = 'Tracked Operations Tasks';
      url = 'http://localhost:5173/tasks';
      count = totalTasks;
      color = 'green';
      isExternal = true;
      const cached = stats?.drilldown?.pendingTasks || [];
      setDrilldown({
        type,
        title,
        url,
        count,
        color,
        isExternal: true,
        items: cached,
      });
      if (cached.length === 0) {
        setDrilldownLoading(true);
        try {
          const res = await api.get('/tasks/all?limit=30');
          setDrilldown((prev) => (prev ? { ...prev, items: res.data.tasks || [] } : null));
        } catch (err) {
          console.error(err);
        } finally {
          setDrilldownLoading(false);
        }
      }
    } else if (type === 'audit') {
      title = 'Security Audit Events';
      url = '/audit';
      count = `${activities.length}+`;
      color = 'amber';
      setDrilldown({
        type,
        title,
        url,
        count,
        color,
        isExternal: false,
        items: activities,
      });
    }
  };

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
        </div>
      </div>

      {/* Interactive KPI Cards */}
      <div className="admin-metrics-grid">
        {/* Total System Users */}
        <div
          className="admin-metric-card-interactive blue"
          onClick={() => openDrilldown('users')}
          title="Click to inspect all registered users"
        >
          <div className="admin-metric-card-header">
            <div className="metric-icon-wrap blue">
              <FiUsers />
            </div>
            <span className="admin-metric-badge">DIRECTORY</span>
          </div>
          <div className="metric-content">
            <span className="metric-label">Total System Users</span>
            <div className="metric-value">{users.length}</div>
            <div className="metric-subtext">
              <span>{adminCount} Admins</span> • <span>{managerCount} Managers</span> • <span>{employeeCount} Employees</span>
            </div>
          </div>
          <div className="admin-metric-card-footer">
            <span>Manage accounts</span>
            <Link
              to="/users"
              className="admin-metric-link-btn"
              onClick={(e) => e.stopPropagation()}
            >
              Open Users <FiArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Corporate Projects */}
        <div
          className="admin-metric-card-interactive purple"
          onClick={() => openDrilldown('projects')}
          title="Click to inspect all corporate projects"
        >
          <div className="admin-metric-card-header">
            <div className="metric-icon-wrap purple">
              <FiFolder />
            </div>
            <span className="admin-metric-badge">WORKFLOWS</span>
          </div>
          <div className="metric-content">
            <span className="metric-label">Corporate Projects</span>
            <div className="metric-value">{totalProjects}</div>
            <div className="metric-subtext">
              <span>{activeProjects} Active</span> • <span>{Math.max(0, totalProjects - activeProjects)} Planning/Other</span>
            </div>
          </div>
          <div className="admin-metric-card-footer">
            <span>Project oversight</span>
            <Link
              to="/projects"
              className="admin-metric-link-btn"
              onClick={(e) => e.stopPropagation()}
            >
              Open Projects <FiArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Tracked Operations Tasks */}
        <div
          className="admin-metric-card-interactive green"
          onClick={() => openDrilldown('tasks')}
          title="Click to inspect tracked operations tasks"
        >
          <div className="admin-metric-card-header">
            <div className="metric-icon-wrap green">
              <FiCheckCircle />
            </div>
            <span className="admin-metric-badge">DELIVERABLES</span>
          </div>
          <div className="metric-content">
            <span className="metric-label">Tracked Operations Tasks</span>
            <div className="metric-value">{totalTasks}</div>
            <div className="metric-subtext">
              <span>{completedTasks} completed</span> • <span>{pendingTasks} pending</span>
            </div>
          </div>
          <div className="admin-metric-card-footer">
            <span>Tasks board</span>
            <a
              href="http://localhost:5173/tasks"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-metric-link-btn"
              onClick={(e) => e.stopPropagation()}
            >
              Portal Board <FiExternalLink size={13} />
            </a>
          </div>
        </div>

        {/* Security Audit Events */}
        <div
          className="admin-metric-card-interactive amber"
          onClick={() => openDrilldown('audit')}
          title="Click to inspect security audit trail"
        >
          <div className="admin-metric-card-header">
            <div className="metric-icon-wrap amber">
              <FiActivity />
            </div>
            <span className="admin-metric-badge">IMMUTABLE LOGS</span>
          </div>
          <div className="metric-content">
            <span className="metric-label">Security Audit Events</span>
            <div className="metric-value">{activities.length}+</div>
            <div className="metric-subtext">
              <span>Immutable activity logs recorded</span>
            </div>
          </div>
          <div className="admin-metric-card-footer">
            <span>Audit trail</span>
            <Link
              to="/audit"
              className="admin-metric-link-btn"
              onClick={(e) => e.stopPropagation()}
            >
              Open Audit <FiArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Admin Drilldown Modal */}
      {drilldown && (
        <div className="modal-backdrop" onClick={() => setDrilldown(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '700px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>{drilldown.title}</h2>
                  <span className="badge-pill online">{drilldown.count} Total</span>
                </div>
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.825rem', color: 'var(--admin-text-muted)' }}>
                  {drilldown.type === 'users' && 'Active user directory credentials and role clearance across the enterprise.'}
                  {drilldown.type === 'projects' && 'Corporate workflows and deliverables currently managed across departments.'}
                  {drilldown.type === 'tasks' && 'Workstream items tracked across TODO, In Progress, Review, and Completed stages.'}
                  {drilldown.type === 'audit' && 'Security event logs and change auditing recorded in the immutable database.'}
                </p>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setDrilldown(null)}
                style={{ fontSize: '1.25rem', color: 'var(--admin-text-muted)' }}
              >
                <FiX />
              </button>
            </div>

            {/* Scrollable Items List */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.3rem', margin: '0.5rem 0' }}>
              {drilldownLoading ? (
                <div className="admin-page-loader" style={{ padding: '2rem' }}>
                  <div className="admin-spinner"></div>
                  <p>Loading {drilldown.title}...</p>
                </div>
              ) : !drilldown.items || drilldown.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--admin-text-muted)' }}>
                  <FiLayers size={36} style={{ opacity: 0.3 }} />
                  <p style={{ marginTop: '0.5rem' }}>No telemetry items found.</p>
                </div>
              ) : (
                <div>
                  {drilldown.items.map((item, idx) => {
                    if (drilldown.type === 'users') {
                      return (
                        <div key={item._id || idx} className="admin-drilldown-item">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div className="admin-avatar">
                              {item.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <div className="admin-drilldown-title">{item.name}</div>
                              <div className="admin-drilldown-meta">
                                <span>{item.email}</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span
                              style={{
                                textTransform: 'uppercase',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.55rem',
                                borderRadius: '999px',
                                background:
                                  item.role === 'admin'
                                    ? 'rgba(239, 68, 68, 0.2)'
                                    : item.role === 'manager'
                                    ? 'rgba(59, 130, 246, 0.2)'
                                    : 'rgba(16, 185, 129, 0.2)',
                                color:
                                  item.role === 'admin'
                                    ? '#fca5a5'
                                    : item.role === 'manager'
                                    ? '#93c5fd'
                                    : '#86efac',
                              }}
                            >
                              {item.role}
                            </span>
                          </div>
                        </div>
                      );
                    } else if (drilldown.type === 'projects') {
                      return (
                        <div key={item._id || idx} className="admin-drilldown-item">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="admin-drilldown-title">{item.name}</div>
                            <div className="admin-drilldown-meta">
                              <span
                                style={{
                                  textTransform: 'uppercase',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '999px',
                                  background: item.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                                  color: item.status === 'active' ? '#34d399' : '#94a3b8',
                                }}
                              >
                                {item.status}
                              </span>
                              <span>Manager: {item.manager?.name || 'Unassigned'}</span>
                              <span>Deadline: {item.deadline ? new Date(item.deadline).toLocaleDateString() : 'N/A'}</span>
                            </div>
                          </div>
                          <Link
                            to="/projects"
                            className="admin-btn admin-btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.7rem' }}
                            onClick={() => setDrilldown(null)}
                          >
                            Inspect Oversight
                          </Link>
                        </div>
                      );
                    } else if (drilldown.type === 'tasks') {
                      return (
                        <div key={item._id || idx} className="admin-drilldown-item">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="admin-drilldown-title">{item.title}</div>
                            <div className="admin-drilldown-meta">
                              <span
                                style={{
                                  textTransform: 'uppercase',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '999px',
                                  background: 'rgba(59, 130, 246, 0.2)',
                                  color: '#60a5fa',
                                }}
                              >
                                {item.status}
                              </span>
                              {item.project?.name && (
                                <span style={{ color: '#c084fc' }}>Project: {item.project.name}</span>
                              )}
                              <span>Assignee: {item.assignee?.name || 'Unassigned'}</span>
                              <span>Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                          </div>
                          <a
                            href="http://localhost:5173/tasks"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-btn admin-btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.7rem' }}
                          >
                            Open in Portal <FiExternalLink size={12} />
                          </a>
                        </div>
                      );
                    } else if (drilldown.type === 'audit') {
                      return (
                        <div key={item._id || idx} className="admin-drilldown-item">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="admin-drilldown-title">{item.details || item.action}</div>
                            <div className="admin-drilldown-meta">
                              <span style={{ color: '#f87171', fontWeight: 600 }}>User: {item.user?.name || 'System'}</span>
                              <span style={{ color: '#94a3b8' }}>Entity: {item.entityType || 'General'}</span>
                              <span style={{ color: '#64748b' }}>
                                {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '1rem',
                borderTop: '1px solid var(--admin-border)',
                marginTop: '0.5rem',
              }}
            >
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setDrilldown(null)}
              >
                Close
              </button>
              {drilldown.isExternal ? (
                <a
                  href={drilldown.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-btn admin-btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  Open in Operations Portal <FiExternalLink size={14} />
                </a>
              ) : (
                <Link
                  to={drilldown.url}
                  className="admin-btn admin-btn-primary"
                  onClick={() => setDrilldown(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  View Full Management View <FiArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Organizational Role Breakdown */}
      <div className="admin-panel-card" style={{ marginTop: '1.5rem' }}>
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
