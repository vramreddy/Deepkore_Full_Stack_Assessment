import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatStatus, getStatusColor, getPriorityColor, isOverdue } from '../utils/helpers';
import Pagination from '../components/common/Pagination';
import { FiSearch, FiCheckSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';

function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    page: 1,
    sortBy: 'createdAt',
    order: 'desc',
  });

  useEffect(() => {
    fetchTasks();
  }, [filters.page, filters.status, filters.priority, filters.sortBy, filters.order]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = { limit: 10 };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
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
