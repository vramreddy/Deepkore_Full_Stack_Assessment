const Activity = require('../models/Activity');

/**
 * Log an activity/audit entry.
 * @param {Object} params
 * @param {string} params.userId - Who did the action
 * @param {string} params.action - What was done (e.g. 'status_change')
 * @param {string} params.entityType - 'project' or 'task'
 * @param {string} params.entityId - ID of the entity
 * @param {string} params.entityName - Human-readable name of the entity
 * @param {string} [params.projectId] - Related project ID
 * @param {string} [params.previousValue] - Value before change
 * @param {string} [params.newValue] - Value after change
 * @param {string} [params.details] - Extra details
 */
const logActivity = async ({
  userId,
  action,
  entityType,
  entityId,
  entityName,
  projectId = null,
  previousValue = null,
  newValue = null,
  details = '',
}) => {
  try {
    await Activity.create({
      user: userId,
      action,
      entityType,
      entityId,
      entityName,
      projectId,
      previousValue,
      newValue,
      details,
    });
  } catch (err) {
    // Log but don't crash the main request if audit fails
    console.error('Failed to log activity:', err.message);
  }
};

module.exports = logActivity;
