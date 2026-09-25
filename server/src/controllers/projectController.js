const Project = require('../models/Project');
const Task = require('../models/Task');
const logActivity = require('../utils/logActivity');

/**
 * POST /api/projects
 * Create a new project (admin/manager only)
 */
const createProject = async (req, res) => {
  try {
    const { name, description, startDate, deadline, status, teamMembers } = req.body;

    const project = await Project.create({
      name,
      description,
      startDate,
      deadline,
      status: status || 'planning',
      manager: req.user._id,
      teamMembers: teamMembers || [],
    });

    // Populate references for response
    await project.populate('manager', 'name email');
    await project.populate('teamMembers', 'name email');

    // Audit log
    await logActivity({
      userId: req.user._id,
      action: 'project_created',
      entityType: 'project',
      entityId: project._id,
      entityName: project.name,
      projectId: project._id,
      newValue: project.name,
      details: `Created project "${project.name}"`,
    });

    res.status(201).json({ message: 'Project created successfully', project });
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Create project error:', err);
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: 'Validation failed', errors: messages });
    }
    res.status(500).json({ message: 'Server error creating project.' });
  }
};

/**
 * GET /api/projects
 * List projects with filtering, sorting, pagination
 */
const getProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Employees only see projects they are part of
    if (req.user.role === 'employee') {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [{ teamMembers: req.user._id }, { manager: req.user._id }],
      });
    }

    // Build sort
    const sortOptions = {};
    const validSortFields = ['name', 'startDate', 'deadline', 'status', 'createdAt'];
    if (validSortFields.includes(sortBy)) {
      sortOptions[sortBy] = order === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('manager', 'name email')
        .populate('teamMembers', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Project.countDocuments(filter),
    ]);

    res.json({
      projects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ message: 'Server error fetching projects.' });
  }
};

/**
 * GET /api/projects/:id
 * Get a single project by ID
 */
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('manager', 'name email')
      .populate('teamMembers', 'name email role');

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Employees can only view their own projects
    if (req.user.role === 'employee') {
      const isMember = project.teamMembers.some(
        (m) => m._id.toString() === req.user._id.toString()
      );
      const isManager = project.manager._id.toString() === req.user._id.toString();
      if (!isMember && !isManager) {
        return res.status(403).json({ message: 'You are not a member of this project.' });
      }
    }

    res.json({ project });
  } catch (err) {
    console.error('Get project error:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found.' });
    }
    res.status(500).json({ message: 'Server error fetching project.' });
  }
};

/**
 * PUT /api/projects/:id
 * Update a project (admin/manager only)
 */
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Only the project manager or admin can update
    if (
      req.user.role !== 'admin' &&
      project.manager.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Only the project manager or admin can update this project.' });
    }

    const allowedFields = ['name', 'description', 'startDate', 'deadline', 'status', 'teamMembers'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Track changes for audit
    const changes = [];
    if (updates.status && updates.status !== project.status) {
      changes.push({
        action: 'status_change',
        prev: project.status,
        next: updates.status,
        detail: `Changed status from "${project.status}" to "${updates.status}"`,
      });
    }
    if (updates.name && updates.name !== project.name) {
      changes.push({
        action: 'name_change',
        prev: project.name,
        next: updates.name,
        detail: `Renamed project from "${project.name}" to "${updates.name}"`,
      });
    }

    Object.assign(project, updates);
    await project.save();

    // Populate for response
    await project.populate('manager', 'name email');
    await project.populate('teamMembers', 'name email');

    // Log audit entries for each change
    for (const change of changes) {
      await logActivity({
        userId: req.user._id,
        action: change.action,
        entityType: 'project',
        entityId: project._id,
        entityName: project.name,
        projectId: project._id,
        previousValue: change.prev,
        newValue: change.next,
        details: change.detail,
      });
    }

    // Log member changes
    if (updates.teamMembers) {
      await logActivity({
        userId: req.user._id,
        action: 'members_updated',
        entityType: 'project',
        entityId: project._id,
        entityName: project.name,
        projectId: project._id,
        details: 'Updated team members',
      });
    }

    res.json({ message: 'Project updated successfully', project });
  } catch (err) {
    console.error('Update project error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: 'Validation failed', errors: messages });
    }
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found.' });
    }
    res.status(500).json({ message: 'Server error updating project.' });
  }
};

/**
 * DELETE /api/projects/:id
 * Delete a project and its tasks (admin only)
 */
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Delete all tasks in this project
    await Task.deleteMany({ project: project._id });

    await project.deleteOne();

    // Audit log
    await logActivity({
      userId: req.user._id,
      action: 'project_deleted',
      entityType: 'project',
      entityId: project._id,
      entityName: project.name,
      projectId: project._id,
      details: `Deleted project "${project.name}" and all its tasks`,
    });

    res.json({ message: 'Project and its tasks deleted successfully.' });
  } catch (err) {
    console.error('Delete project error:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found.' });
    }
    res.status(500).json({ message: 'Server error deleting project.' });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
};
