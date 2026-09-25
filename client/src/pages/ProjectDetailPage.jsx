import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatStatus, getStatusColor, getPriorityColor, isOverdue } from '../utils/helpers';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { FiPlus, FiSearch, FiArrowLeft, FiEdit2, FiTrash2, FiCalendar, FiUser, FiUsers } from 'react-icons/fi';

function ProjectDetailPage() {
  const { id } = useParams();
  const { canManage, isAdmin } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskPagination, setTaskPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);

  // Task filters
  const [taskFilters, setTaskFilters] = useState({
    search: '',
    status: '',
    priority: '',
    page: 1,
  });

  // Task form
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assignee: '',
  });
  const [taskFormLoading, setTaskFormLoading] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState(null);

  useEffect(() => {
    fetchProject();
    fetchActivities();
  }, [id]);

  useEffect(() => {
    fetchTasks();
  }, [id, taskFilters.page, taskFilters.status, taskFilters.priority]);

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data.project);
    } catch (err) {
      toast.error('Failed to load project.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const params = { limit: 10 };
      if (taskFilters.search) params.search = taskFilters.search;
      if (taskFilters.status) params.status = taskFilters.status;
      if (taskFilters.priority) params.priority = taskFilters.priority;
      params.page = taskFilters.page;

      const res = await api.get(`/projects/${id}/tasks`, { params });
      setTasks(res.data.tasks);
      setTaskPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await api.get('/activities', {
        params: { projectId: id, limit: 10 },
      });
      setActivities(res.data.activities);
    } catch (err) {
      console.error('Failed to load activities:', err);
    }
  };

  const handleTaskSearch = (e) => {
    e.preventDefault();
    setTaskFilters({ ...taskFilters, page: 1 });
    fetchTasks();
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!taskFormData.title || !taskFormData.dueDate) {
      toast.error('Title and due date are required.');
      return;
    }

    setTaskFormLoading(true);
    try {
      const payload = { ...taskFormData };
      if (!payload.assignee) delete payload.assignee;

      await api.post(`/projects/${id}/tasks`, payload);
      toast.success('Task created!');
      setShowTaskForm(false);
      setTaskFormData({ title: '', description: '', priority: 'medium', dueDate: '', assignee: '' });
      fetchTasks();
      fetchActivities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setTaskFormLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;
    try {
      await api.delete(`/tasks/${deleteTaskId}`);
      toast.success('Task deleted.');
      setDeleteTaskId(null);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task.');
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner"></div>
        <p>Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="error-state">
        <h3>Project not found</h3>
        <Link to="/projects" className="btn btn-primary">
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="project-detail-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <Link to="/projects" className="back-link">
            <FiArrowLeft /> Back to Projects
          </Link>
          <h1>{project.name}</h1>
          <span className={`badge ${getStatusColor(project.status)}`}>
            {formatStatus(project.status)}
          </span>
        </div>
      </div>

      {/* Project Info */}
      <div className="project-info-grid">
        <div className="info-card">
          <p className="info-text">{project.description || 'No description provided.'}</p>
          <div className="info-meta">
            <div className="info-item">
              <FiCalendar />
              <span>Start: {formatDate(project.startDate)}</span>
            </div>
            <div className="info-item">
              <FiCalendar />
              <span>Deadline: {formatDate(project.deadline)}</span>
            </div>
            <div className="info-item">
              <FiUser />
              <span>Manager: {project.manager?.name}</span>
            </div>
          </div>
        </div>

        <div className="info-card">
          <h3>
            <FiUsers style={{ marginRight: '0.5rem' }} /> Team Members ({project.teamMembers?.length || 0})
          </h3>
          {project.teamMembers?.length > 0 ? (
            <div className="team-list">
              {project.teamMembers.map((member) => (
                <div key={member._id} className="team-member">
                  <div className="avatar-small">{member.name?.charAt(0)?.toUpperCase()}</div>
                  <div>
                    <span className="member-name">{member.name}</span>
                    <span className="member-email">{member.email}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No team members assigned yet.</p>
          )}
        </div>
      </div>

      {/* Tasks Section */}
      <div className="section-header">
        <h2>Tasks</h2>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowTaskForm(true)}>
            <FiPlus /> New Task
          </button>
        )}
      </div>

      {/* Task Filters */}
      <div className="filters-bar">
        <form className="search-form" onSubmit={handleTaskSearch}>
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={taskFilters.search}
              onChange={(e) => setTaskFilters({ ...taskFilters, search: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
        <div className="filter-controls">
          <select
            value={taskFilters.status}
            onChange={(e) => setTaskFilters({ ...taskFilters, status: e.target.value, page: 1 })}
          >
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={taskFilters.priority}
            onChange={(e) => setTaskFilters({ ...taskFilters, priority: e.target.value, page: 1 })}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      {tasks.length === 0 ? (
        <div className="empty-state">
          <h3>No tasks found</h3>
          <p>{canManage ? 'Create your first task for this project.' : 'No tasks match your filters.'}</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id} className={isOverdue(task.dueDate, task.status) ? 'row-overdue' : ''}>
                    <td>
                      <Link to={`/tasks/${task._id}`} className="table-link">
                        {task.title}
                      </Link>
                    </td>
                    <td>
                      <span className={`badge ${getStatusColor(task.status)}`}>
                        {formatStatus(task.status)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getPriorityColor(task.priority)}`}>
                        {formatStatus(task.priority)}
                      </span>
                    </td>
                    <td>{task.assignee?.name || '—'}</td>
                    <td className={isOverdue(task.dueDate, task.status) ? 'text-danger' : ''}>
                      {formatDate(task.dueDate)}
                      {isOverdue(task.dueDate, task.status) && (
                        <span className="overdue-badge">Overdue</span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/tasks/${task._id}`} className="btn-icon" title="View">
                          <FiEdit2 />
                        </Link>
                        {canManage && (
                          <button
                            className="btn-icon btn-icon-danger"
                            onClick={() => setDeleteTaskId(task._id)}
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            pagination={taskPagination}
            onPageChange={(page) => setTaskFilters({ ...taskFilters, page })}
          />
        </>
      )}

      {/* Activity Timeline */}
      {activities.length > 0 && (
        <div className="section-header" style={{ marginTop: '2rem' }}>
          <h2>Recent Activity</h2>
        </div>
      )}
      {activities.length > 0 && (
        <div className="activity-timeline">
          {activities.map((act) => (
            <div key={act._id} className="activity-item">
              <div className="activity-dot" />
              <div className="activity-content">
                <span className="activity-user">{act.user?.name}</span>
                <span className="activity-action"> {act.action?.replace(/_/g, ' ')}</span>
                <span className="activity-entity"> "{act.entityName}"</span>
                {act.previousValue && act.newValue && (
                  <span className="activity-change">
                    : {formatStatus(act.previousValue)} → {formatStatus(act.newValue)}
                  </span>
                )}
                <span className="activity-time">{formatDate(act.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskForm && (
        <div className="modal-overlay" onClick={() => setShowTaskForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label htmlFor="task-title">Title *</label>
                <input
                  id="task-title"
                  type="text"
                  value={taskFormData.title}
                  onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="task-desc">Description</label>
                <textarea
                  id="task-desc"
                  value={taskFormData.description}
                  onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                  placeholder="Describe the task..."
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="task-priority">Priority</label>
                  <select
                    id="task-priority"
                    value={taskFormData.priority}
                    onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="task-due">Due Date *</label>
                  <input
                    id="task-due"
                    type="date"
                    value={taskFormData.dueDate}
                    onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="task-assignee">Assign To</label>
                <select
                  id="task-assignee"
                  value={taskFormData.assignee}
                  onChange={(e) => setTaskFormData({ ...taskFormData, assignee: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {project.teamMembers?.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={taskFormLoading}>
                  {taskFormLoading ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTaskId}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        onConfirm={handleDeleteTask}
        onCancel={() => setDeleteTaskId(null)}
      />
    </div>
  );
}

export default ProjectDetailPage;
