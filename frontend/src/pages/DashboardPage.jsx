import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatStatus, formatDate, isOverdue } from '../utils/helpers';
import { FiFolder, FiCheckSquare, FiAlertTriangle, FiClock, FiUsers, FiTrendingUp } from 'react-icons/fi';

function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, canManage } = useAuth();

  useEffect(() => {
    fetchDashboard();
  }, []);

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
        <h1>Dashboard</h1>
        <p className="page-description">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">
            <FiFolder />
          </div>
          <div className="stat-info">
            <span className="stat-value">{data.projects.total}</span>
            <span className="stat-label">Total Projects</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-green">
            <FiTrendingUp />
          </div>
          <div className="stat-info">
            <span className="stat-value">{data.projects.active}</span>
            <span className="stat-label">Active Projects</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-yellow">
            <FiClock />
          </div>
          <div className="stat-info">
            <span className="stat-value">{data.tasks.pending}</span>
            <span className="stat-label">Pending Tasks</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-red">
            <FiAlertTriangle />
          </div>
          <div className="stat-info">
            <span className="stat-value">{data.tasks.overdue}</span>
            <span className="stat-label">Overdue Tasks</span>
          </div>
        </div>
      </div>

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

        {/* Employee Workload (Manager/Admin only) */}
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
