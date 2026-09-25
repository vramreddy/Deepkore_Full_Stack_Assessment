const express = require('express');
const router = express.Router();
const {
  getTask,
  updateTask,
  deleteTask,
  addComment,
  getAllTasks,
  addWorklog,
  getTimesheetSummary,
} = require('../controllers/taskController');
const { authenticate, authorize } = require('../middleware/auth');
const { updateTaskRules, commentRules } = require('../validators/task');
const validate = require('../middleware/validate');

// All task routes require authentication
router.use(authenticate);

// Timesheet summary (must be before :id)
router.get('/timesheet/summary', getTimesheetSummary);

// Get all tasks across projects (for dashboard views)
router.get('/all', getAllTasks);

// Single task operations
router.get('/:id', getTask);
router.put('/:id', updateTaskRules, validate, updateTask);
router.delete('/:id', authorize('admin', 'manager'), deleteTask);

// Workday Timesheet / Worklog
router.post('/:id/worklogs', addWorklog);

// Comments
router.post('/:id/comments', commentRules, validate, addComment);

module.exports = router;
