const Task = require('../models/Task');
const Project = require('../models/Project');
const logActivity = require('../utils/logActivity');

/**
 * POST /api/projects/:projectId/tasks
 * Create a task within a project (admin/manager)
 */
const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, priority, dueDate, assignee } = req.body;

    // Make sure project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Only project manager or admin can create tasks
    if (
      req.user.role !== 'admin' &&
      project.manager.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Only the project manager or admin can create tasks.' });
    }

    // If assignee is provided, check they are a member of the project
    if (assignee) {
      const isMember = project.teamMembers.some(
        (m) => m.toString() === assignee
      );
      const isManager = project.manager.toString() === assignee;
      if (!isMember && !isManager) {
        return res.status(400).json({
          message: 'Assignee must be a team member of this project.',
        });
      }
    }

    const task = await Task.create({
      title,
      description,
      project: projectId,
      priority: priority || 'medium',
      dueDate,
      assignee: assignee || null,
    });

    await task.populate('assignee', 'name email');

    // Audit log
    await logActivity({
      userId: req.user._id,
      action: 'task_created',
      entityType: 'task',
      entityId: task._id,
      entityName: task.title,
      projectId: projectId,
      newValue: task.title,
      details: `Created task "${task.title}" in project "${project.name}"`,
    });

    if (assignee) {
      await logActivity({
        userId: req.user._id,
        action: 'task_assigned',
        entityType: 'task',
        entityId: task._id,
        entityName: task.title,
        projectId: projectId,
        newValue: assignee,
        details: `Assigned task "${task.title}"`,
      });
    }

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (err) {
    console.error('Create task error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: 'Validation failed', errors: messages });
    }
    res.status(500).json({ message: 'Server error creating task.' });
  }
};

/**
 * GET /api/projects/:projectId/tasks
 * Get all tasks for a project with filtering and pagination
 */
const getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      assignee,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      dueBefore,
      dueAfter,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Build filter
    const filter = { project: projectId };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (dueBefore || dueAfter) {
      filter.dueDate = {};
      if (dueBefore) filter.dueDate.$lte = new Date(dueBefore);
      if (dueAfter) filter.dueDate.$gte = new Date(dueAfter);
    }

    // Employees can only see tasks assigned to them or project tasks if they are a member
    if (req.user.role === 'employee') {
      const isMember = project.teamMembers.some(
        (m) => m.toString() === req.user._id.toString()
      );
      if (!isMember && project.manager.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You are not a member of this project.' });
      }
    }

    // Build sort
    const sortOptions = {};
    const validSortFields = ['title', 'priority', 'status', 'dueDate', 'createdAt'];
    if (validSortFields.includes(sortBy)) {
      sortOptions[sortBy] = order === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignee', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Task.countDocuments(filter),
    ]);

    res.json({
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ message: 'Server error fetching tasks.' });
  }
};

/**
 * GET /api/tasks/:id
 * Get a single task by ID
 */
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email')
      .populate('project', 'name manager teamMembers')
      .populate('comments.user', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    res.json({ task });
  } catch (err) {
    console.error('Get task error:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found.' });
    }
    res.status(500).json({ message: 'Server error fetching task.' });
  }
};

/**
 * PUT /api/tasks/:id
 * Update a task
 */
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: 'Parent project not found.' });
    }

    const isAdmin = req.user.role === 'admin';
    const isProjectManager = project.manager.toString() === req.user._id.toString();
    const isAssignee = task.assignee && task.assignee.toString() === req.user._id.toString();

    // Employees can only update their own tasks' status
    if (req.user.role === 'employee') {
      if (!isAssignee) {
        return res.status(403).json({ message: 'You can only update tasks assigned to you.' });
      }
      // Employees can only change status, not reassign or change priority
      const employeeAllowed = ['status'];
      const attemptedFields = Object.keys(req.body);
      const forbidden = attemptedFields.filter((f) => !employeeAllowed.includes(f));
      if (forbidden.length > 0) {
        return res.status(403).json({
          message: `Employees can only update: ${employeeAllowed.join(', ')}`,
        });
      }
    }

    // Only manager/admin can reassign or change priority
    if (!isAdmin && !isProjectManager) {
      if (req.body.assignee !== undefined || req.body.priority !== undefined) {
        return res.status(403).json({
          message: 'Only the project manager or admin can reassign tasks or change priority.',
        });
      }
    }

    // Validate status transitions
    if (req.body.status && req.body.status !== task.status) {
      const isValid = Task.isValidTransition(task.status, req.body.status);
      if (!isValid) {
        return res.status(400).json({
          message: `Invalid status transition from "${task.status}" to "${req.body.status}".`,
        });
      }
    }

    // Validate assignee is a project member
    if (req.body.assignee) {
      const isMember = project.teamMembers.some(
        (m) => m.toString() === req.body.assignee
      );
      const isMgr = project.manager.toString() === req.body.assignee;
      if (!isMember && !isMgr) {
        return res.status(400).json({
          message: 'Assignee must be a team member of this project.',
        });
      }
    }

    // Track changes for audit
    const changes = [];
    if (req.body.status && req.body.status !== task.status) {
      changes.push({
        action: 'status_change',
        prev: task.status,
        next: req.body.status,
        detail: `Changed status from "${task.status}" to "${req.body.status}"`,
      });
    }
    if (req.body.priority && req.body.priority !== task.priority) {
      changes.push({
        action: 'priority_change',
        prev: task.priority,
        next: req.body.priority,
        detail: `Changed priority from "${task.priority}" to "${req.body.priority}"`,
      });
    }
    if (req.body.assignee && (!task.assignee || req.body.assignee !== task.assignee.toString())) {
      changes.push({
        action: 'task_reassigned',
        prev: task.assignee ? task.assignee.toString() : 'unassigned',
        next: req.body.assignee,
        detail: 'Reassigned task',
      });
    }

    // Apply updates
    const allowedFields = ['title', 'description', 'priority', 'status', 'dueDate', 'assignee'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    await task.save();
    await task.populate('assignee', 'name email');

    // Log audit entries
    for (const change of changes) {
      await logActivity({
        userId: req.user._id,
        action: change.action,
        entityType: 'task',
        entityId: task._id,
        entityName: task.title,
        projectId: task.project,
        previousValue: change.prev,
        newValue: change.next,
        details: change.detail,
      });
    }

    res.json({ message: 'Task updated successfully', task });
  } catch (err) {
    console.error('Update task error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: 'Validation failed', errors: messages });
    }
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found.' });
    }
    res.status(500).json({ message: 'Server error updating task.' });
  }
};

/**
 * DELETE /api/tasks/:id
 * Delete a task (admin/manager only)
 */
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const project = await Project.findById(task.project);
    if (
      req.user.role !== 'admin' &&
      (!project || project.manager.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ message: 'Only the project manager or admin can delete tasks.' });
    }

    await logActivity({
      userId: req.user._id,
      action: 'task_deleted',
      entityType: 'task',
      entityId: task._id,
      entityName: task.title,
      projectId: task.project,
      details: `Deleted task "${task.title}"`,
    });

    await task.deleteOne();

    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('Delete task error:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found.' });
    }
    res.status(500).json({ message: 'Server error deleting task.' });
  }
};

/**
 * POST /api/tasks/:id/comments
 * Add a comment to a task
 */
const addComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    task.comments.push({
      user: req.user._id,
      text: req.body.text,
    });

    await task.save();
    await task.populate('comments.user', 'name email');

    // Audit log
    await logActivity({
      userId: req.user._id,
      action: 'comment_added',
      entityType: 'task',
      entityId: task._id,
      entityName: task.title,
      projectId: task.project,
      details: `Added a comment on "${task.title}"`,
    });

    res.status(201).json({
      message: 'Comment added',
      comments: task.comments,
    });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ message: 'Server error adding comment.' });
  }
};

/**
 * GET /api/tasks/all
 * Get all tasks across projects (for dashboard / global views)
 */
const getAllTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      assignee,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      dueBefore,
      dueAfter,
      projectId,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;
    if (projectId) filter.project = projectId;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (dueBefore || dueAfter) {
      filter.dueDate = {};
      if (dueBefore) filter.dueDate.$lte = new Date(dueBefore);
      if (dueAfter) filter.dueDate.$gte = new Date(dueAfter);
    }

    // Employees only see their own tasks
    if (req.user.role === 'employee') {
      filter.assignee = req.user._id;
    }

    const sortOptions = {};
    const validSortFields = ['title', 'priority', 'status', 'dueDate', 'createdAt'];
    if (validSortFields.includes(sortBy)) {
      sortOptions[sortBy] = order === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignee', 'name email')
        .populate('project', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Task.countDocuments(filter),
    ]);

    res.json({
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('Get all tasks error:', err);
    res.status(500).json({ message: 'Server error fetching tasks.' });
  }
};

/**
 * POST /api/tasks/:id/worklogs
 * Log hours worked on a task (Workday / Accenture Timesheet style)
 */
const addWorklog = async (req, res) => {
  try {
    const { hours, notes, date } = req.body;
    const numHours = parseFloat(hours);

    if (isNaN(numHours) || numHours <= 0 || numHours > 24) {
      return res.status(400).json({ message: 'Hours must be a number between 0.25 and 24.' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const isAssignee = task.assignee && task.assignee.toString() === req.user._id.toString();
    const canManage = req.user.role === 'admin' || req.user.role === 'manager';

    if (!isAssignee && !canManage) {
      return res.status(403).json({ message: 'You can only log time on tasks assigned to you.' });
    }

    task.worklogs.push({
      user: req.user._id,
      hours: numHours,
      notes: notes || '',
      date: date ? new Date(date) : new Date(),
    });

    task.loggedHours = task.worklogs.reduce((sum, w) => sum + (w.hours || 0), 0);
    await task.save();
    await task.populate('worklogs.user', 'name email');

    await logActivity({
      userId: req.user._id,
      action: 'time_logged',
      entityType: 'task',
      entityId: task._id,
      entityName: task.title,
      projectId: task.project,
      details: `Logged ${numHours}h on "${task.title}": ${notes || 'No description'}`,
    });

    res.status(201).json({
      message: `${numHours} hours logged successfully`,
      loggedHours: task.loggedHours,
      worklogs: task.worklogs,
    });
  } catch (err) {
    console.error('Add worklog error:', err);
    res.status(500).json({ message: 'Server error logging time.' });
  }
};

/**
 * GET /api/tasks/timesheet/summary
 * Get weekly timesheet summary for current user
 */
const getTimesheetSummary = async (req, res) => {
  try {
    const tasks = await Task.find({
      'worklogs.user': req.user._id,
    })
      .select('title project status loggedHours estimatedHours worklogs')
      .populate('project', 'name');

    let totalHours = 0;
    const recentLogs = [];

    tasks.forEach((t) => {
      (t.worklogs || []).forEach((w) => {
        if (w.user && w.user.toString() === req.user._id.toString()) {
          totalHours += w.hours || 0;
          recentLogs.push({
            taskId: t._id,
            taskTitle: t.title,
            projectName: t.project?.name || 'General Project',
            hours: w.hours,
            date: w.date,
            notes: w.notes,
          });
        }
      });
    });

    recentLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      totalHours: Math.round(totalHours * 10) / 10,
      weeklyTarget: 40,
      utilizationRate: Math.min(100, Math.round((totalHours / 40) * 100)),
      recentLogs: recentLogs.slice(0, 15),
    });
  } catch (err) {
    console.error('Timesheet summary error:', err);
    res.status(500).json({ message: 'Server error fetching timesheet summary.' });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  addComment,
  getAllTasks,
  addWorklog,
  getTimesheetSummary,
};
