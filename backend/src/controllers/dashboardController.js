const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

/**
 * GET /api/dashboard
 * Returns dashboard statistics computed from the database
 */
const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Base filter for role-based access
    let projectFilter = {};
    let taskFilter = {};

    if (userRole === 'employee') {
      // Employees see only their assigned tasks and projects
      const myProjects = await Project.find({
        $or: [{ teamMembers: userId }, { manager: userId }],
      }).select('_id');
      const projectIds = myProjects.map((p) => p._id);
      projectFilter = { _id: { $in: projectIds } };
      taskFilter = { assignee: userId };
    }

    // Project stats
    const [totalProjects, activeProjects, completedProjects] = await Promise.all([
      Project.countDocuments(projectFilter),
      Project.countDocuments({ ...projectFilter, status: 'active' }),
      Project.countDocuments({ ...projectFilter, status: 'completed' }),
    ]);

    // Task stats
    const now = new Date();
    const [totalTasks, pendingTasks, overdueTasks, completedTasks] = await Promise.all([
      Task.countDocuments(taskFilter),
      Task.countDocuments({
        ...taskFilter,
        status: { $in: ['todo', 'in_progress', 'review'] },
      }),
      Task.countDocuments({
        ...taskFilter,
        status: { $ne: 'completed' },
        dueDate: { $lt: now },
      }),
      Task.countDocuments({ ...taskFilter, status: 'completed' }),
    ]);

    // Task status distribution
    const statusDistribution = await Task.aggregate([
      { $match: taskFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Priority distribution
    const priorityDistribution = await Task.aggregate([
      { $match: taskFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Employee workload (admin/manager only - shows tasks per person)
    let employeeWorkload = [];
    if (userRole !== 'employee') {
      employeeWorkload = await Task.aggregate([
        { $match: { assignee: { $ne: null }, status: { $ne: 'completed' } } },
        { $group: { _id: '$assignee', taskCount: { $sum: 1 } } },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 1,
            taskCount: 1,
            name: '$user.name',
            email: '$user.email',
          },
        },
        { $sort: { taskCount: -1 } },
        { $limit: 10 },
      ]);
    }

    // Project progress (tasks completed / total tasks per project)
    let projectProgress = [];
    const projectIds = projectFilter._id
      ? projectFilter._id.$in
      : (await Project.find().select('_id').lean()).map((p) => p._id);

    if (projectIds.length > 0) {
      projectProgress = await Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        {
          $group: {
            _id: '$project',
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
          },
        },
        {
          $lookup: {
            from: 'projects',
            localField: '_id',
            foreignField: '_id',
            as: 'project',
          },
        },
        { $unwind: '$project' },
        {
          $project: {
            _id: 1,
            projectName: '$project.name',
            projectStatus: '$project.status',
            total: 1,
            completed: 1,
            progress: {
              $cond: [
                { $eq: ['$total', 0] },
                0,
                {
                  $multiply: [{ $divide: ['$completed', '$total'] }, 100],
                },
              ],
            },
          },
        },
        { $sort: { projectName: 1 } },
      ]);
    }

    // Recent overdue tasks (top 5)
    const recentOverdue = await Task.find({
      ...taskFilter,
      status: { $ne: 'completed' },
      dueDate: { $lt: now },
    })
      .populate('assignee', 'name email')
      .populate('project', 'name')
      .sort({ dueDate: 1 })
      .limit(5)
      .lean();

    res.json({
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
      },
      tasks: {
        total: totalTasks,
        pending: pendingTasks,
        overdue: overdueTasks,
        completed: completedTasks,
      },
      statusDistribution,
      priorityDistribution,
      employeeWorkload,
      projectProgress,
      recentOverdue,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Server error fetching dashboard data.' });
  }
};

module.exports = { getDashboard };
