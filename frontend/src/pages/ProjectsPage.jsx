import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatStatus, getStatusColor } from '../utils/helpers';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { FiPlus, FiSearch, FiFilter, FiTrash2, FiEdit2, FiFolder, FiCheckSquare, FiLayers, FiAlertCircle } from 'react-icons/fi';

function ProjectsPage() {
  const { canManage, isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    deadlineBefore: '',
    deadlineAfter: '',
    page: 1,
    sortBy: 'createdAt',
    order: 'desc',
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    deadline: '',
    status: 'planning',
    teamMembers: [],
  });
  const [initialTasks, setInitialTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [filters.page, filters.status, filters.deadlineBefore, filters.deadlineAfter, filters.sortBy, filters.order]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = { ...filters, limit: 10 };
      // Remove empty values
      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });

      const res = await api.get('/projects', { params });
      setProjects(res.data.projects);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    fetchProjects();
  };

  const openCreateForm = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      startDate: '',
      deadline: '',
      status: 'planning',
      teamMembers: [],
    });
    setInitialTasks([]);
    fetchUsers();
    setShowForm(true);
  };

  const openEditForm = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      deadline: project.deadline ? project.deadline.split('T')[0] : '',
      status: project.status,
      teamMembers: project.teamMembers?.map((m) => m._id) || [],
    });
    setInitialTasks([]);
    fetchUsers();
    setShowForm(true);
  };

  const handleAddInitialTask = () => {
    const defaultAssignee = formData.teamMembers.length > 0 ? formData.teamMembers[0] : '';
    setInitialTasks((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        title: '',
        assignee: defaultAssignee,
        priority: 'medium',
        dueDate: formData.deadline || '',
        description: '',
        estimatedHours: 8,
      },
    ]);
  };

  const handleUpdateInitialTask = (index, field, value) => {
    setInitialTasks((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveInitialTask = (index) => {
    setInitialTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.startDate || !formData.deadline) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setFormLoading(true);
    try {
      if (editingProject) {
        await api.put(`/projects/${editingProject._id}`, formData);
        toast.success('Project updated!');
      } else {
        const validTasks = initialTasks
          .filter((t) => t.title && t.title.trim())
          .map((t) => ({
            title: t.title.trim(),
            description: t.description ? t.description.trim() : '',
            assignee: t.assignee || null,
            priority: t.priority || 'medium',
            dueDate: t.dueDate || formData.deadline,
            estimatedHours: t.estimatedHours ? Number(t.estimatedHours) : 8,
          }));

        const payload = {
          ...formData,
          initialTasks: validTasks,
        };

        const res = await api.post('/projects', payload);
        const taskCount = res.data.tasks?.length || 0;
        if (taskCount > 0) {
          toast.success(`Project created with ${taskCount} assigned task${taskCount > 1 ? 's' : ''}!`);
        } else {
          toast.success('Project created successfully!');
        }
      }
      setShowForm(false);
      fetchProjects();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save project.';
      toast.error(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/projects/${deleteId}`);
      toast.success('Project deleted.');
      setDeleteId(null);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project.');
    }
  };

  const handleMemberToggle = (userId) => {
    setFormData((prev) => {
      const isSelected = prev.teamMembers.includes(userId);
      const members = isSelected
        ? prev.teamMembers.filter((id) => id !== userId)
        : [...prev.teamMembers, userId];

      // If a member was unselected, update any initial tasks assigned to them
      if (isSelected) {
        setInitialTasks((tPrev) =>
          tPrev.map((task) =>
            task.assignee === userId
              ? { ...task, assignee: members.length > 0 ? members[0] : '' }
              : task
          )
        );
      }
      return { ...prev, teamMembers: members };
    });
  };

  return (
    <div className="projects-page">
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p className="page-description">Manage your projects and teams</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={openCreateForm}>
            <FiPlus /> New Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search projects..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>

        <div className="filter-controls">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          >
            <option value="">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={
              filters.deadlineBefore && !filters.deadlineAfter
                ? 'past_deadline'
                : filters.deadlineAfter
                ? 'upcoming_deadline'
                : ''
            }
            onChange={(e) => {
              const val = e.target.value;
              const today = new Date().toISOString().split('T')[0];
              if (val === 'past_deadline') {
                setFilters({ ...filters, deadlineBefore: today, deadlineAfter: '', page: 1 });
              } else if (val === 'upcoming_deadline') {
                setFilters({ ...filters, deadlineBefore: '', deadlineAfter: today, page: 1 });
              } else {
                setFilters({ ...filters, deadlineBefore: '', deadlineAfter: '', page: 1 });
              }
            }}
          >
            <option value="">All Deadlines</option>
            <option value="upcoming_deadline">Upcoming Deadlines</option>
            <option value="past_deadline">Past Deadlines</option>
          </select>

          <select
            value={`${filters.sortBy}-${filters.order}`}
            onChange={(e) => {
              const [sortBy, order] = e.target.value.split('-');
              setFilters({ ...filters, sortBy, order });
            }}
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="deadline-asc">Deadline (Earliest)</option>
            <option value="deadline-desc">Deadline (Latest)</option>
          </select>

          {(filters.search || filters.status || filters.deadlineBefore || filters.deadlineAfter) && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                setFilters({
                  search: '',
                  status: '',
                  deadlineBefore: '',
                  deadlineAfter: '',
                  page: 1,
                  sortBy: 'createdAt',
                  order: 'desc',
                })
              }
              style={{ fontSize: '0.825rem', padding: '0.4rem 0.75rem' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="page-loader">
          <div className="spinner"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <FiFolder size={48} style={{ opacity: 0.4 }} />
          <h3>No projects found</h3>
          <p>
            {canManage
              ? 'Create your first project to get started.'
              : 'No projects have been assigned to you yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="project-grid">
            {projects.map((project) => (
              <Link
                to={`/projects/${project._id}`}
                key={project._id}
                className="project-card"
              >
                <div className="project-card-header">
                  <h3 className="project-card-title">{project.name}</h3>
                  <span className={`badge ${getStatusColor(project.status)}`}>
                    {formatStatus(project.status)}
                  </span>
                </div>
                <p className="project-card-desc">
                  {project.description
                    ? project.description.substring(0, 120) + (project.description.length > 120 ? '...' : '')
                    : 'No description'}
                </p>
                <div className="project-card-meta">
                  <span>Manager: {project.manager?.name || '—'}</span>
                  <span>{project.teamMembers?.length || 0} members</span>
                </div>
                <div className="project-card-dates">
                  <span>Start: {formatDate(project.startDate)}</span>
                  <span>Deadline: {formatDate(project.deadline)}</span>
                </div>

                {canManage && (
                  <div className="project-card-actions" onClick={(e) => e.preventDefault()}>
                    <button
                      className="btn-icon"
                      onClick={(e) => {
                        e.preventDefault();
                        openEditForm(project);
                      }}
                      title="Edit"
                    >
                      <FiEdit2 />
                    </button>
                    {isAdmin && (
                      <button
                        className="btn-icon btn-icon-danger"
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteId(project._id);
                        }}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={(page) => setFilters({ ...filters, page })}
          />
        </>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content modal-xl" onClick={(e) => e.stopPropagation()}>
            <h2>{editingProject ? 'Edit Project' : 'Create New Project'}</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label htmlFor="proj-name">Project Name *</label>
                <input
                  id="proj-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="proj-desc">Description</label>
                <textarea
                  id="proj-desc"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the project..."
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="proj-start">Start Date *</label>
                  <input
                    id="proj-start"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="proj-deadline">Deadline *</label>
                  <input
                    id="proj-deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="proj-status">Status</label>
                <select
                  id="proj-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group">
                <label>Assign Team Members (Employees & Managers)</label>
                <div className="member-list">
                  {users
                    .filter((u) => u.role === 'employee' || u.role === 'manager')
                    .map((u) => (
                      <label key={u._id} className="member-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.teamMembers.includes(u._id)}
                          onChange={() => handleMemberToggle(u._id)}
                        />
                        <span>
                          {u.name} ({u.role})
                        </span>
                      </label>
                    ))}
                </div>
              </div>

              {/* Manager Employee Task & Scope Assignment */}
              {!editingProject && (
                <div className="project-tasks-section">
                  <div className="project-tasks-header">
                    <div>
                      <h3 className="section-title">
                        <FiLayers className="section-icon" /> Assign Employee Tasks & Deliverables
                      </h3>
                      <p className="section-subtitle">
                        Specify what each team member should do in this project immediately upon creation.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleAddInitialTask}
                      disabled={formData.teamMembers.length === 0}
                      title={formData.teamMembers.length === 0 ? 'Select team members above first' : 'Add a deliverable'}
                    >
                      <FiPlus /> Add Task / Deliverable
                    </button>
                  </div>

                  {formData.teamMembers.length === 0 ? (
                    <div className="task-assignment-notice">
                      <FiAlertCircle />
                      <span>Select team members above first to assign tasks and work scopes to them.</span>
                    </div>
                  ) : initialTasks.length === 0 ? (
                    <div className="task-empty-hint">
                      <p>
                        No tasks assigned yet. Click <strong>"+ Add Task / Deliverable"</strong> to define employee assignments and instructions.
                      </p>
                    </div>
                  ) : (
                    <div className="initial-tasks-list">
                      {initialTasks.map((task, idx) => (
                        <div key={task.id || idx} className="initial-task-card">
                          <div className="initial-task-card-header">
                            <span className="task-number-badge">
                              <FiCheckSquare /> Task #{idx + 1}
                            </span>
                            <button
                              type="button"
                              className="btn-icon btn-icon-danger"
                              onClick={() => handleRemoveInitialTask(idx)}
                              title="Remove deliverable"
                            >
                              <FiTrash2 />
                            </button>
                          </div>

                          <div className="form-row">
                            <div className="form-group flex-2">
                              <label>Deliverable / Task Title *</label>
                              <input
                                type="text"
                                placeholder="e.g. Design Dashboard Wireframes, Build Payment API..."
                                value={task.title}
                                onChange={(e) => handleUpdateInitialTask(idx, 'title', e.target.value)}
                                required
                              />
                            </div>
                            <div className="form-group flex-1">
                              <label>Assign To Employee *</label>
                              <select
                                value={task.assignee}
                                onChange={(e) => handleUpdateInitialTask(idx, 'assignee', e.target.value)}
                              >
                                <option value="">Select Employee...</option>
                                {users
                                  .filter((u) => formData.teamMembers.includes(u._id))
                                  .map((u) => (
                                    <option key={u._id} value={u._id}>
                                      {u.name} ({u.role})
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label>Priority</label>
                              <select
                                value={task.priority}
                                onChange={(e) => handleUpdateInitialTask(idx, 'priority', e.target.value)}
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Due Date</label>
                              <input
                                type="date"
                                value={task.dueDate}
                                onChange={(e) => handleUpdateInitialTask(idx, 'dueDate', e.target.value)}
                              />
                            </div>
                            <div className="form-group">
                              <label>Est. Hours</label>
                              <input
                                type="number"
                                min="1"
                                max="500"
                                value={task.estimatedHours}
                                onChange={(e) => handleUpdateInitialTask(idx, 'estimatedHours', e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label>What the employee should do / Scope of Work</label>
                            <textarea
                              rows={2}
                              placeholder="Detail the exact tasks, deliverables, expected output, and requirements for the employee..."
                              value={task.description}
                              onChange={(e) => handleUpdateInitialTask(idx, 'description', e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading
                    ? 'Saving...'
                    : editingProject
                    ? 'Update Project'
                    : initialTasks.filter((t) => t.title.trim()).length > 0
                    ? `Create Project & Assign ${initialTasks.filter((t) => t.title.trim()).length} Task(s)`
                    : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Project"
        message="This will permanently delete the project and all its tasks. This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

export default ProjectsPage;
