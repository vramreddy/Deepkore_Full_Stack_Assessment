import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime, formatStatus, getStatusColor, getPriorityColor, isOverdue } from '../utils/helpers';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiSend, FiCalendar, FiUser, FiFlag, FiAlertTriangle } from 'react-icons/fi';

function TaskDetailPage() {
  const { id } = useParams();
  const { user, canManage } = useAuth();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);

  // For updating status
  const [updating, setUpdating] = useState(false);

  // Comments
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Edit fields (manager)
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [projectMembers, setProjectMembers] = useState([]);

  useEffect(() => {
    fetchTask();
    fetchActivities();
  }, [id]);

  const fetchTask = async () => {
    try {
      const res = await api.get(`/tasks/${id}`);
      setTask(res.data.task);

      // If manager, also get project members for reassignment
      if (res.data.task.project) {
        try {
          const projRes = await api.get(`/projects/${res.data.task.project._id || res.data.task.project}`);
          setProjectMembers(projRes.data.project.teamMembers || []);
        } catch (e) {
          // It's ok if this fails
        }
      }
    } catch (err) {
      toast.error('Failed to load task.');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await api.get('/activities', {
        params: { entityType: 'task', entityId: id, limit: 20 },
      });
      setActivities(res.data.activities);
    } catch (err) {
      console.error('Failed to load activities:', err);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      const res = await api.put(`/tasks/${id}`, { status: newStatus });
      setTask(res.data.task);
      toast.success(`Status updated to ${formatStatus(newStatus)}`);
      fetchActivities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.post(`/tasks/${id}/comments`, { text: commentText });
      setTask((prev) => ({ ...prev, comments: res.data.comments }));
      setCommentText('');
      toast.success('Comment added!');
      fetchActivities();
    } catch (err) {
      toast.error('Failed to add comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleEditSave = async () => {
    setUpdating(true);
    try {
      const res = await api.put(`/tasks/${id}`, editData);
      setTask(res.data.task);
      setEditMode(false);
      toast.success('Task updated!');
      fetchActivities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task.');
    } finally {
      setUpdating(false);
    }
  };

  const openEditMode = () => {
    setEditData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      assignee: task.assignee?._id || '',
    });
    setEditMode(true);
  };

  // Determine valid next statuses for buttons
  const getNextStatuses = (currentStatus) => {
    const transitions = {
      todo: ['in_progress'],
      in_progress: ['review', 'todo'],
      review: ['completed', 'in_progress'],
      completed: [],
    };
    return transitions[currentStatus] || [];
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner"></div>
        <p>Loading task...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="error-state">
        <h3>Task not found</h3>
        <Link to="/projects" className="btn btn-primary">
          Back to Projects
        </Link>
      </div>
    );
  }

  const isAssignee = task.assignee && task.assignee._id === user?.id;
  const canUpdateStatus = canManage || isAssignee;
  const nextStatuses = getNextStatuses(task.status);

  return (
    <div className="task-detail-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <Link
            to={task.project?._id ? `/projects/${task.project._id}` : '/projects'}
            className="back-link"
          >
            <FiArrowLeft /> Back to {task.project?.name || 'Projects'}
          </Link>
          <h1>{task.title}</h1>
          <div className="task-badges">
            <span className={`badge ${getStatusColor(task.status)}`}>
              {formatStatus(task.status)}
            </span>
            <span className={`badge ${getPriorityColor(task.priority)}`}>
              <FiFlag style={{ marginRight: '4px' }} />
              {formatStatus(task.priority)}
            </span>
            {isOverdue(task.dueDate, task.status) && (
              <span className="badge badge-danger">
                <FiAlertTriangle style={{ marginRight: '4px' }} />
                Overdue
              </span>
            )}
          </div>
        </div>
        {canManage && !editMode && (
          <button className="btn btn-secondary" onClick={openEditMode}>
            Edit Task
          </button>
        )}
      </div>

      <div className="task-detail-grid">
        {/* Main Content */}
        <div className="task-main">
          {/* Edit Mode */}
          {editMode ? (
            <div className="info-card">
              <h3>Edit Task</h3>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={editData.priority}
                    onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
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
                    value={editData.dueDate}
                    onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Assign To</label>
                <select
                  value={editData.assignee}
                  onChange={(e) => setEditData({ ...editData, assignee: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {projectMembers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => setEditMode(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleEditSave} disabled={updating}>
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="info-card">
              <h3>Description</h3>
              <p className="info-text">{task.description || 'No description provided.'}</p>

              <div className="info-meta">
                <div className="info-item">
                  <FiUser />
                  <span>Assigned to: {task.assignee?.name || 'Unassigned'}</span>
                </div>
                <div className="info-item">
                  <FiCalendar />
                  <span>Due: {formatDate(task.dueDate)}</span>
                </div>
                <div className="info-item">
                  <FiCalendar />
                  <span>Created: {formatDate(task.createdAt)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Status Transition Buttons */}
          {canUpdateStatus && nextStatuses.length > 0 && (
            <div className="status-actions">
              <h3>Update Status</h3>
              <div className="status-buttons">
                {nextStatuses.map((status) => (
                  <button
                    key={status}
                    className={`btn ${
                      status === 'completed'
                        ? 'btn-success'
                        : status === 'review'
                        ? 'btn-warning'
                        : 'btn-secondary'
                    }`}
                    onClick={() => handleStatusChange(status)}
                    disabled={updating}
                  >
                    Move to {formatStatus(status)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="comments-section">
            <h3>Comments ({task.comments?.length || 0})</h3>

            {task.comments?.length > 0 ? (
              <div className="comments-list">
                {task.comments.map((comment) => (
                  <div key={comment._id} className="comment-item">
                    <div className="comment-header">
                      <div className="comment-user">
                        <div className="avatar-small">
                          {comment.user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="comment-user-name">{comment.user?.name || 'Unknown'}</span>
                      </div>
                      <span className="comment-time">{formatDateTime(comment.createdAt)}</span>
                    </div>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">No comments yet. Be the first to comment!</p>
            )}

            <form className="comment-form" onSubmit={handleAddComment}>
              <textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                maxLength={1000}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!commentText.trim() || submittingComment}
              >
                <FiSend style={{ marginRight: '0.5rem' }} />
                {submittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          </div>
        </div>

        {/* Activity Sidebar */}
        <div className="task-sidebar">
          <div className="info-card">
            <h3>Activity History</h3>
            {activities.length === 0 ? (
              <p className="text-muted">No activity recorded.</p>
            ) : (
              <div className="activity-timeline compact">
                {activities.map((act) => (
                  <div key={act._id} className="activity-item">
                    <div className="activity-dot" />
                    <div className="activity-content">
                      <strong>{act.user?.name}</strong>
                      <span> {act.action?.replace(/_/g, ' ')}</span>
                      {act.previousValue && act.newValue && (
                        <div className="activity-values">
                          <span className="value-old">{formatStatus(act.previousValue)}</span>
                          <span> → </span>
                          <span className="value-new">{formatStatus(act.newValue)}</span>
                        </div>
                      )}
                      <span className="activity-time">{formatDateTime(act.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskDetailPage;
