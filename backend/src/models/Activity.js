const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      // e.g., 'status_change', 'task_created', 'task_assigned', 'priority_change', 'comment_added', 'project_created', 'member_added'
    },
    entityType: {
      type: String,
      enum: ['project', 'task', 'user'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    entityName: {
      type: String,
      trim: true,
      default: '',
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    previousValue: {
      type: String,
      default: null,
    },
    newValue: {
      type: String,
      default: null,
    },
    details: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ entityType: 1, entityId: 1 });
activitySchema.index({ projectId: 1 });
activitySchema.index({ user: 1 });
activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
