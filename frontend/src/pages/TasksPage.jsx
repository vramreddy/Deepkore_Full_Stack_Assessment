import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatStatus, getStatusColor, getPriorityColor, isOverdue } from '../utils/helpers';
import Pagination from '../components/common/Pagination';
import { FiSearch, FiCheckSquare, FiX, FiAlertTriangle, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

function TasksPage() {
  const { user, canManage } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  const [filters, setFilters] = useState(() => {
    const statusParam = searchParams.get('status') || '';
    const filterParam = searchParams.get('filter') || '';
    const today = new Date().toISOString().split('T')[0];

    let initialDueBefore = '';
    let initialStatus = statusParam;

    if (filterParam === 'overdue' || statusParam === 'overdue') {
      initialDueBefore = today;
      initialStatus = 'overdue';
    } else if (filterParam === 'pending' || statusParam === 'pending') {
      initialStatus = 'pending';
    }

    return {
      search: searchParams.get('search') || '',
      status: initialStatus,
      priority: searchParams.get('priority') || '',
      assignee: searchParams.get('assignee') || '',
      dueBefore: initialDueBefore,
      dueAfter: '',
      page: 1,
      sortBy: 'createdAt',
      order: 'desc',
    };
  });

  useEffect(() => {
    const statusParam = searchParams.get('status');
    const filterParam = searchParams.get('filter');
    const today = new Date().toISOString().split('T')[0];

    if (filterParam === 'overdue' || statusParam === 'overdue') {
      setFilters((prev) => ({
        ...prev,
        status: 'overdue',
        dueBefore: today,
        dueAfter: '',
        page: 1,
      }));
    } else if (filterParam === 'pending' || statusParam === 'pending') {
      setFilters((prev) => ({
        ...prev,
        status: 'pending',
        dueBefore: '',
        page: 1,
      }));
    } else if (statusParam !== null) {
      setFilters((prev) => ({
        ...prev,
        status: statusParam,
        dueBefore: '',
        page: 1,
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (canManage) {
      api.get('/auth/users')
        .then((res) => setUsers(res.data.users || []))
        .catch((err) => console.error('Failed to load users:', err));
    }
  }, [canManage]);

  useEffect(() => {
    fetchTasks();
  }, [
    filters.page,
    filters.status,
    filters.priority,
    filters.assignee,
    filters.dueBefore,
    filters.dueAfter,
    filters.sortBy,
    filters.order,
  ]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = { limit: 10 };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.assignee) params.assignee = filters.assignee;
      if (filters.dueBefore) params.dueBefore = filters.dueBefore;
      if (filters.dueAfter) params.dueAfter = filters.dueAfter;
      params.page = filters.page;
      params.sortBy = filters.sortBy;
      params.order = filters.order;

      const res = await api.get('/tasks/all', { params });
      setTasks(res.data.tasks);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    fetchTasks();
  };

  const handleResetFilters = () => {
    setSearchParams({});
    setFilters({
      search: '',
      status: '',
      priority: '',
      assignee: '',
      dueBefore: '',
      dueAfter: '',
      page: 1,
      sortBy: 'createdAt',
      order: 'desc',
    });
  };

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div>
          <h1>All Tasks</h1>
          <p className="page-description">
            {user?.role === 'employee' ? 'Tasks assigned to you' : 'All tasks across projects'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search tasks..."
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
            onChange={(e) => {
              const val = e.target.value;
              const today = new Date().toISOString().split('T')[0];
              if (val === 'overdue') {
                setFilters({ ...filters, status: 'overdue', dueBefore: today, dueAfter: '', page: 1 });
              } else if (val === 'pending') {
                setFilters({ ...filters, status: 'pending', dueBefore: '', dueAfter: '', page: 1 });
              } else {
                setFilters({ ...filters, status: val, dueBefore: '', page: 1 });
              }
            }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Tasks (Incomplete)</option>
            <option value="overdue">Overdue Tasks</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          {canManage && (
            <select
              value={filters.assignee}
              onChange={(e) => setFilters({ ...filters, assignee: e.target.value, page: 1 })}
            >
              <option value="">All Employees</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          )}
          <select
            value={
              filters.status === 'overdue' || (filters.dueBefore && !filters.dueAfter)
                ? 'overdue'
                : filters.dueAfter
                ? 'future'
                : ''
            }
            onChange={(e) => {
              const val = e.target.value;
              const today = new Date().toISOString().split('T')[0];
              if (val === 'overdue') {
                setFilters({ ...filters, status: 'overdue', dueBefore: today, dueAfter: '', page: 1 });
              } else if (val === 'future') {
                setFilters({ ...filters, dueBefore: '', dueAfter: today, page: 1 });
              } else {
                setFilters({ ...filters, dueBefore: '', dueAfter: '', page: 1 });
              }
            }}
          >
            <option value="">All Due Dates</option>
            <option value="overdue">Overdue Tasks</option>
            <option value="future">Upcoming Tasks</option>
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
            <option value="dueDate-asc">Due Date (Earliest)</option>
            <option value="dueDate-desc">Due Date (Latest)</option>
            <option value="priority-desc">Priority (Highest)</option>
            <option value="priority-asc">Priority (Lowest)</option>
          </select>
          {(filters.search || filters.status || filters.priority || filters.assignee || filters.dueBefore || filters.dueAfter) && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetFilters}
              style={{ fontSize: '0.825rem', padding: '0.4rem 0.75rem' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Active Quick Filter Notification */}
      {(filters.status === 'pending' || filters.status === 'overdue' || filters.dueBefore) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '8px', padding: '0.65rem 1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem' }}>
            {filters.status === 'overdue' ? <FiAlertTriangle style={{ color: '#ef4444' }} /> : <FiClock style={{ color: '#eab308' }} />}
            <span style={{ color: 'var(--text-muted)' }}>Quick Filter Active:</span>
            <span className={`badge ${filters.status === 'overdue' ? 'badge-danger' : 'badge-warning'}`}>
              {filters.status === 'overdue' ? 'Overdue Tasks' : 'Pending Tasks (TODO, IN PROGRESS, REVIEW)'}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({pagination?.total ?? tasks.length} task{pagination?.total !== 1 ? 's' : ''} found)</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleResetFilters}
            style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <FiX size={14} /> Show All Tasks
          </button>
        </div>
      )}

      {/* Tasks List */}
      {loading ? (
        <div className="page-loader">
          <div className="spinner"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <FiCheckSquare size={48} style={{ opacity: 0.4 }} />
          <h3>No tasks found</h3>
          <p>No tasks match your current filters.</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Due Date</th>
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
                      {task.project ? (
                        <Link to={`/projects/${task.project._id}`} className="table-link-secondary">
                          {task.project.name}
                        </Link>
                      ) : (
                        '—'
                      )}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            pagination={pagination}
            onPageChange={(page) => setFilters({ ...filters, page })}
          />
        </>
      )}
    </div>
  );
}

export default TasksPage;
