const Activity = require('../models/Activity');

/**
 * GET /api/activities
 * Get activity log with filtering and pagination
 */
const getActivities = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      entityType,
      entityId,
      projectId,
      userId,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = entityId;
    if (projectId) filter.projectId = projectId;
    if (userId) filter.user = userId;

    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Activity.countDocuments(filter),
    ]);

    res.json({
      activities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('Get activities error:', err);
    res.status(500).json({ message: 'Server error fetching activities.' });
  }
};

module.exports = { getActivities };
