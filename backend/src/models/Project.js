const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [150, 'Project name cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
        message: 'Invalid project status',
      },
      default: 'planning',
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project manager is required'],
    },
    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Validate that deadline is after start date
projectSchema.pre('validate', function (next) {
  if (this.startDate && this.deadline && this.deadline <= this.startDate) {
    this.invalidate('deadline', 'Deadline must be after start date');
  }
  next();
});

projectSchema.index({ manager: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ teamMembers: 1 });
projectSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Project', projectSchema);
