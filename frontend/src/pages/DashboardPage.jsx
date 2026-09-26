import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatStatus, formatDate, getStatusColor, getPriorityColor, isOverdue } from '../utils/helpers';
import {
  FiFolder,
  FiCheckSquare,
  FiAlertTriangle,
  FiClock,
  FiUsers,
  FiTrendingUp,
  FiExternalLink,
  FiArrowRight,
  FiX,
  FiLayers,
} from 'react-icons/fi';

function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drilldown, setDrilldown] = useState(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const { user, canManage } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
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

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      setData(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load dashboard data.');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openDrilldown = async (type) => {
    let title = '';
    let url = '';
    let count = 0;
    let color = 'blue';

    if (type === 'totalProjects') {
      title = 'Total Projects';
      url = '/projects';
      count = data?.projects?.total || 0;
      color = 'blue';
    } else if (type === 'activeProjects') {
      title = 'Active Projects';
      url = '/projects?status=active';
      count = data?.projects?.active || 0;
      color = 'green';
    } else if (type === 'pendingTasks') {
      title = 'Pending Tasks';
      url = '/tasks?status=pending';
      count = data?.tasks?.pending || 0;
      color = 'yellow';
    } else if (type === 'overdueTasks') {
      title = 'Overdue Tasks';
      url = '/tasks?status=overdue';
      count = data?.tasks?.overdue || 0;
      color = 'red';
    }

    const cachedItems = data?.drilldown?.[type] || [];
    setDrilldown({
      type,
      title,
      url,
      count,
      color,
      items: cachedItems,
    });

    if (!cachedItems || cachedItems.length === 0) {
      setDrilldownLoading(true);
      try {
        if (type === 'totalProjects') {
          const res = await api.get('/projects?limit=25');
          setDrilldown((prev) => (prev ? { ...prev, items: res.data.projects || [] } : null));
        } else if (type === 'activeProjects') {
          const res = await api.get('/projects?status=active&limit=25');
          setDrilldown((prev) => (prev ? { ...prev, items: res.data.projects || [] } : null));
        } else if (type === 'pendingTasks') {
          const res = await api.get('/tasks/all?status=pending&limit=25');
          setDrilldown((prev) => (prev ? { ...prev, items: res.data.tasks || [] } : null));
        } else if (type === 'overdueTasks') {
          const res = await api.get('/tasks/all?status=overdue&limit=25');
          setDrilldown((prev) => (prev ? { ...prev, items: res.data.tasks || [] } : null));
        }
      } catch (err) {
        console.error('Failed to load drilldown items:', err);
      } finally {
        setDrilldownLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <FiAlertTriangle size={48} />
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchDashboard}>
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>{user?.role === 'manager' ? 'Operations Dashboard' : 'Employee Workstation'}</h1>
        <p className="page-description">Welcome back, {user?.name}!</p>
      </div>

      {/* Role-Specific Portal Banner */}
      {user?.role === 'manager' && (
        <div className="role-portal-banner banner-manager">
          <div className="banner-left">
            <span className="banner-badge">MANAGER WORKSPACE</span>
            <h3>Team Project Allocation & Workload Dashboard</h3>
            <p>Create and assign tasks to project members, adjust priorities, and monitor deliverables against deadlines.</p>
          </div>
          <Link to="/projects" className="btn btn-primary banner-action-btn">
            Manage Projects →
          </Link>
        </div>
      )}

      {user?.role === 'employee' && (
        <div className="role-portal-banner banner-employee">
          <div className="banner-left">
            <span className="banner-badge">EMPLOYEE DESK</span>
            <h3>My Operational Workstation & Tasks</h3>
            <p>Focus on your assigned deliverables, advance task workflows from TODO to COMPLETED, and collaborate on comments.</p>
          </div>
          <Link to="/tasks" className="btn btn-primary banner-action-btn">
            View My Tasks Board →
          </Link>
        </div>
      )}

      {/* Interactive Stats Cards Grid */}
      <div className="stats-grid">
        {/* Total Projects */}
        <div
          className="stat-card-clickable blue"
          onClick={() => openDrilldown('totalProjects')}
          title="Click to view list of all projects"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-badge">WORKSPACE</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Click to view</span>
          </div>
          <div className="stat-card-main">
            <div className="stat-icon stat-icon-blue">
              <FiFolder />
            </div>
            <div className="stat-info">
              <span className="stat-value">{data.projects.total}</span>
              <span className="stat-label">Total Projects</span>
            </div>
          </div>
          <div className="stat-card-footer">
            <span>All initiatives</span>
            <Link
              to="/projects"
              className="stat-card-link-action"
              onClick={(e) => e.stopPropagation()}
            >
              Open Page <FiArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Active Projects */}
        <div
          className="stat-card-clickable green"
          onClick={() => openDrilldown('activeProjects')}
          title="Click to view list of active projects"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-badge">IN PROGRESS</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Click to view</span>
          </div>
          <div className="stat-card-main">
            <div className="stat-icon stat-icon-green">
              <FiTrendingUp />
            </div>
            <div className="stat-info">
              <span className="stat-value">{data.projects.active}</span>
              <span className="stat-label">Active Projects</span>
            </div>
          </div>
          <div className="stat-card-footer">
            <span>Executing now</span>
            <Link
              to="/projects?status=active"
              className="stat-card-link-action"
              onClick={(e) => e.stopPropagation()}
            >
              Open Page <FiArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Pending Tasks */}
        <div
          className="stat-card-clickable yellow"
          onClick={() => openDrilldown('pendingTasks')}
          title="Click to view list of pending tasks"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-badge">INCOMPLETE</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Click to view</span>
          </div>
          <div className="stat-card-main">
            <div className="stat-icon stat-icon-yellow">
              <FiClock />
            </div>
            <div className="stat-info">
              <span className="stat-value">{data.tasks.pending}</span>
              <span className="stat-label">Pending Tasks</span>
            </div>
          </div>
          <div className="stat-card-footer">
            <span>TODO, In Progress, Review</span>
            <Link
              to="/tasks?status=pending"
              className="stat-card-link-action"
              onClick={(e) => e.stopPropagation()}
            >
              Open Page <FiArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Overdue Tasks */}
        <div
          className="stat-card-clickable red"
          onClick={() => openDrilldown('overdueTasks')}
          title="Click to view list of overdue tasks"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-badge" style={{ color: '#f87171' }}>NEEDS ATTENTION</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Click to view</span>
          </div>
          <div className="stat-card-main">
            <div className="stat-icon stat-icon-red">
              <FiAlertTriangle />
            </div>
            <div className="stat-info">
              <span className="stat-value">{data.tasks.overdue}</span>
              <span className="stat-label">Overdue Tasks</span>
            </div>
          </div>
          <div className="stat-card-footer">
            <span>Past deadline</span>
            <Link
              to="/tasks?status=overdue"
              className="stat-card-link-action"
              onClick={(e) => e.stopPropagation()}
            >
              Open Page <FiArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Drilldown Modal Overlay */}
      {drilldown && (
        <div className="modal-backdrop" onClick={() => setDrilldown(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '680px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{drilldown.title}</h2>
                  <span className="badge badge-primary">{drilldown.count} Total</span>
                </div>
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  {drilldown.type === 'totalProjects' && 'Comprehensive overview of all projects currently created in this workspace.'}
                  {drilldown.type === 'activeProjects' && 'Projects with active operational status currently being delivered.'}
                  {drilldown.type === 'pendingTasks' && 'All non-completed tasks (TODO, IN PROGRESS, REVIEW) across projects.'}
                  {drilldown.type === 'overdueTasks' && 'Tasks whose due date has passed without being completed.'}
                </p>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setDrilldown(null)}
                style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}
              >
                <FiX />
              </button>
            </div>

            {/* List Body with scroll */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.3rem', margin: '0.5rem 0' }}>
              {drilldownLoading ? (
                <div className="page-loader" style={{ padding: '2rem' }}>
                  <div className="spinner"></div>
                  <p>Loading {drilldown.title}...</p>
                </div>
              ) : !drilldown.items || drilldown.items.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <FiLayers size={36} style={{ opacity: 0.4 }} />
                  <p style={{ marginTop: '0.5rem' }}>No items found in this category.</p>
                </div>
              ) : (
                <div className="drilldown-list">
                  {drilldown.items.map((item) => {
                    const isProject = drilldown.type === 'totalProjects' || drilldown.type === 'activeProjects';
                    if (isProject) {
                      return (
                        <div key={item._id} className="drilldown-item-card">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="drilldown-item-title">{item.name}</div>
                            <div className="drilldown-item-meta">
                              <span className={`badge ${getStatusColor(item.status)}`}>
                                {formatStatus(item.status)}
                              </span>
                              <span>Manager: {item.manager?.name || 'Unassigned'}</span>
                              <span>Deadline: {formatDate(item.deadline)}</span>
                            </div>
                          </div>
                          <Link
                            to={`/projects/${item._id}`}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}
                            onClick={() => setDrilldown(null)}
                          >
                            Open Project <FiExternalLink size={13} />
                          </Link>
                        </div>
                      );
                    } else {
                      // Task item
                      return (
                        <div key={item._id} className="drilldown-item-card">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="drilldown-item-title">{item.title}</div>
                            <div className="drilldown-item-meta">
                              <span className={`badge ${getStatusColor(item.status)}`}>
                                {formatStatus(item.status)}
                              </span>
                              <span className={`badge ${getPriorityColor(item.priority)}`}>
                                {item.priority?.toUpperCase()}
                              </span>
                              {item.project?.name && (
                                <span style={{ color: 'var(--primary-light)' }}>
                                  Project: {item.project.name}
                                </span>
                              )}
                              <span>Assignee: {item.assignee?.name || 'Unassigned'}</span>
                              <span style={{ color: drilldown.type === 'overdueTasks' ? '#f87171' : 'var(--text-secondary)' }}>
                                Due: {formatDate(item.dueDate)}
                              </span>
                            </div>
                          </div>
                          <Link
                            to={`/tasks/${item._id}`}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}
                            onClick={() => setDrilldown(null)}
                          >
                            Open Task <FiExternalLink size={13} />
                          </Link>
                        </div>
                      );
                    }
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
                borderTop: '1px solid var(--border-color)',
                marginTop: '0.5rem',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDrilldown(null)}
              >
                Close
              </button>
              <Link
                to={drilldown.url}
                className="btn btn-primary"
                onClick={() => setDrilldown(null)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                Go to Full Filtered Page <FiArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="dashboard-grid">
        {/* Project Progress */}
        <div className="dashboard-card">
          <h3 className="card-title">Project Progress</h3>
          {data.projectProgress.length === 0 ? (
            <div className="empty-state-small">
              <p>No project data available.</p>
            </div>
          ) : (
            <div className="progress-list">
              {data.projectProgress.map((proj) => (
                <div key={proj._id} className="progress-item">
                  <div className="progress-info">
                    <span className="progress-name">{proj.projectName}</span>
                    <span className="progress-percent">
                      {Math.round(proj.progress)}%
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${Math.round(proj.progress)}%` }}
                    />
                  </div>
                  <span className="progress-detail">
                    {proj.completed}/{proj.total} tasks completed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Task Status Distribution */}
        <div className="dashboard-card">
          <h3 className="card-title">Task Overview</h3>
          {data.statusDistribution.length === 0 ? (
            <div className="empty-state-small">
              <p>No tasks found.</p>
            </div>
          ) : (
            <div className="status-breakdown">
              {data.statusDistribution.map((item) => (
                <div key={item._id} className="status-item">
                  <span className={`badge ${item._id === 'todo' ? 'badge-secondary' : item._id === 'in_progress' ? 'badge-info' : item._id === 'review' ? 'badge-warning' : 'badge-success'}`}>
                    {formatStatus(item._id)}
                  </span>
                  <span className="status-count">{item.count}</span>
                </div>
              ))}
            </div>
          )}

          <h3 className="card-title" style={{ marginTop: '1.5rem' }}>Priority Breakdown</h3>
          {data.priorityDistribution.length === 0 ? (
            <div className="empty-state-small">
              <p>No tasks found.</p>
            </div>
          ) : (
            <div className="status-breakdown">
              {data.priorityDistribution.map((item) => (
                <div key={item._id} className="status-item">
                  <span className={`badge ${item._id === 'low' ? 'badge-secondary' : item._id === 'medium' ? 'badge-info' : item._id === 'high' ? 'badge-warning' : 'badge-danger'}`}>
                    {formatStatus(item._id)}
                  </span>
                  <span className="status-count">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Employee Workload (Manager only) */}
        {canManage && data.employeeWorkload.length > 0 && (
          <div className="dashboard-card">
            <h3 className="card-title">
              <FiUsers style={{ marginRight: '0.5rem' }} />
              Employee Workload
            </h3>
            <div className="workload-list">
              {data.employeeWorkload.map((emp) => (
                <div key={emp._id} className="workload-item">
                  <div className="workload-user">
                    <div className="avatar-small">
                      {emp.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <span>{emp.name}</span>
                  </div>
                  <span className="workload-count">
                    {emp.taskCount} active {emp.taskCount === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Overdue Tasks */}
        {data.recentOverdue.length > 0 && (
          <div className="dashboard-card">
            <h3 className="card-title text-danger">
              <FiAlertTriangle style={{ marginRight: '0.5rem' }} />
              Overdue Tasks
            </h3>
            <div className="overdue-list">
              {data.recentOverdue.map((task) => (
                <Link
                  key={task._id}
                  to={`/tasks/${task._id}`}
                  className="overdue-item"
                >
                  <div>
                    <span className="overdue-title">{task.title}</span>
                    <span className="overdue-project">
                      {task.project?.name}
                    </span>
                  </div>
                  <span className="overdue-date">
                    Due: {formatDate(task.dueDate)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
