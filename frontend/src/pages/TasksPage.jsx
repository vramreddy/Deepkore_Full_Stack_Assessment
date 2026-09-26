import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatStatus, getStatusColor, getPriorityColor, isOverdue } from '../utils/helpers';
import Pagination from '../components/common/Pagination';
import { FiSearch, FiCheckSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';

function TasksPage() {
  const { user, canManage } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  const [filters, setFilters] = useState({
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
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          >
            <option value="">All Statuses</option>
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
              filters.dueBefore && !filters.dueAfter
                ? 'overdue'
                : filters.dueAfter
                ? 'future'
                : ''
            }
            onChange={(e) => {
              const val = e.target.value;
              const today = new Date().toISOString().split('T')[0];
              if (val === 'overdue') {
                setFilters({ ...filters, dueBefore: today, dueAfter: '', page: 1 });
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
