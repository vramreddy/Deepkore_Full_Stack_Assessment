/**
 * Format a date string to a readable format
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date string to include time
 */
export function formatDateTime(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Check if a date is overdue (past due date and not completed)
 */
export function isOverdue(dueDate, status) {
  if (status === 'completed') return false;
  return new Date(dueDate) < new Date();
}

/**
 * Get status badge color class
 */
export function getStatusColor(status) {
  const colors = {
    // Project statuses
    planning: 'badge-info',
    active: 'badge-success',
    on_hold: 'badge-warning',
    completed: 'badge-primary',
    cancelled: 'badge-danger',
    // Task statuses
    todo: 'badge-secondary',
    in_progress: 'badge-info',
    review: 'badge-warning',
  };
  return colors[status] || 'badge-secondary';
}

/**
 * Get priority badge color class
 */
export function getPriorityColor(priority) {
  const colors = {
    low: 'badge-secondary',
    medium: 'badge-info',
    high: 'badge-warning',
    critical: 'badge-danger',
  };
  return colors[priority] || 'badge-secondary';
}

/**
 * Format status text for display
 */
export function formatStatus(status) {
  if (!status) return '';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get readable action text for activities
 */
export function getActionText(action) {
  const texts = {
    project_created: 'created project',
    project_deleted: 'deleted project',
    status_change: 'changed status of',
    name_change: 'renamed',
    members_updated: 'updated team members of',
    task_created: 'created task',
    task_deleted: 'deleted task',
    task_assigned: 'assigned',
    task_reassigned: 'reassigned',
    priority_change: 'changed priority of',
    comment_added: 'commented on',
  };
  return texts[action] || action;
}
