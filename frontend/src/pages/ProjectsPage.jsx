import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatStatus, getStatusColor } from '../utils/helpers';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { FiPlus, FiSearch, FiFilter, FiTrash2, FiEdit2 } from 'react-icons/fi';

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
  const [users, setUsers] = useState([]);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [filters.page, filters.status, filters.sortBy, filters.order]);

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
    fetchUsers();
    setShowForm(true);
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
        await api.post('/projects', formData);
        toast.success('Project created!');
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
      const members = prev.teamMembers.includes(userId)
        ? prev.teamMembers.filter((id) => id !== userId)
        : [...prev.teamMembers, userId];
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
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
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
                <label>Team Members</label>
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

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading
                    ? 'Saving...'
                    : editingProject
                    ? 'Update Project'
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
