import { useState, useEffect } from 'react';
import api from '../api/axios';
import { FiFolder, FiSearch, FiFilter, FiExternalLink, FiUsers, FiCalendar, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';

function AdminProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [statusFilter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/projects', { params });
      setProjects(res.data.projects || []);
    } catch (err) {
      toast.error('Failed to load corporate projects.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="admin-content-view">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">PORTFOLIO GOVERNANCE</span>
          <h1 className="admin-title">Corporate Projects Oversight</h1>
          <p className="admin-subtitle">
            Executive oversight over all ongoing projects, timelines, managers, and allocated resources.
          </p>
        </div>

        <a
          href="http://localhost:5173/projects"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-btn admin-btn-secondary"
        >
          <FiExternalLink /> Open Projects Catalog
        </a>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-filter-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search projects by name or scope..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <FiFilter className="filter-icon" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Projects Grid / Table */}
      {loading ? (
        <div className="admin-page-loader">
          <div className="admin-spinner"></div>
          <p>Loading projects portfolio...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty-state">
          <FiFolder size={48} style={{ opacity: 0.3 }} />
          <h3>No projects found</h3>
          <p>No projects match your filter criteria.</p>
        </div>
      ) : (
        <div className="admin-panel-card">
          <div className="admin-audit-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Manager</th>
                  <th>Team Size</th>
                  <th>Timeline</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((proj) => (
                  <tr key={proj._id}>
                    <td>
                      <div className="project-cell">
                        <strong>{proj.name}</strong>
                        <span className="project-desc-micro">
                          {proj.description
                            ? proj.description.substring(0, 70) + (proj.description.length > 70 ? '...' : '')
                            : 'No description provided'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="manager-cell">
                        <FiUser className="cell-icon" />
                        <span>{proj.manager?.name || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="team-count-badge">
                        <FiUsers size={12} /> {proj.teamMembers?.length || 0} members
                      </span>
                    </td>
                    <td className="mono muted">
                      {new Date(proj.startDate).toLocaleDateString()} &rarr; {new Date(proj.deadline).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`status-badge ${proj.status}`}>
                        {proj.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <a
                        href={`http://localhost:5173/projects/${proj._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-table-action-btn"
                        title="View details in Operations Portal"
                      >
                        Inspect <FiExternalLink size={12} />
                      </a>
                    </td>
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

export default AdminProjectsPage;
