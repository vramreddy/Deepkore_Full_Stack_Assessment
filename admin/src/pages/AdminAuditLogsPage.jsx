import { useState, useEffect } from 'react';
import api from '../api/axios';
import { FiFileText, FiFilter, FiSearch, FiRefreshCw, FiUser, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

function AdminAuditLogsPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = { limit: 50 };
      if (actionFilter) params.action = actionFilter;
      const res = await api.get('/activities', { params });
      setActivities(res.data.activities || []);
    } catch (err) {
      toast.error('Failed to load audit trail records.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = activities.filter((act) => {
    const term = search.toLowerCase();
    return (
      (act.details && act.details.toLowerCase().includes(term)) ||
      (act.user?.name && act.user.name.toLowerCase().includes(term)) ||
      (act.entityName && act.entityName.toLowerCase().includes(term)) ||
      (act.action && act.action.toLowerCase().includes(term))
    );
  });

  return (
    <div className="admin-content-view">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">COMPLIANCE & TRACEABILITY</span>
          <h1 className="admin-title">Global Security & Activity Audit Trail</h1>
          <p className="admin-subtitle">
            Immutable system-wide event stream tracking all project allocations, task transitions, and worklog logs.
          </p>
        </div>

        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={fetchLogs}
          disabled={loading}
        >
          <FiRefreshCw className={loading ? 'admin-spin' : ''} /> Refresh Stream
        </button>
      </div>

      {/* Filter and Search */}
      <div className="admin-filter-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search audit trail by actor, details, or entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <FiFilter className="filter-icon" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">All Actions</option>
            <option value="project_created">Projects Created</option>
            <option value="task_created">Tasks Created</option>
            <option value="status_changed">Status Transitions</option>
            <option value="worklog_added">Timesheet / Worklogs</option>
            <option value="user_registered">User Registrations</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-page-loader">
          <div className="admin-spinner"></div>
          <p>Retrieving immutable audit stream...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty-state">
          <FiFileText size={48} style={{ opacity: 0.3 }} />
          <h3>No audit records found</h3>
          <p>No activity records match your current filter selection.</p>
        </div>
      ) : (
        <div className="admin-panel-card">
          <div className="admin-audit-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor / Responsible User</th>
                  <th>Event Category</th>
                  <th>Entity Impacted</th>
                  <th>Audit Log Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log._id}>
                    <td className="mono muted">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <div className="actor-cell">
                        <div className="actor-avatar">
                          {log.user?.name ? log.user.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <strong>{log.user?.name || 'Automated System'}</strong>
                          <span className="user-email-micro">{log.user?.email || 'system@smartops.local'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="audit-action-tag">{log.action}</span>
                    </td>
                    <td>
                      <span className="entity-tag">
                        {log.entityType?.toUpperCase()}: {log.entityName || '—'}
                      </span>
                    </td>
                    <td className="details-text">{log.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAuditLogsPage;
