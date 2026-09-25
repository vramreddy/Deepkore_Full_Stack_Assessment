const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { createTask, getTasks } = require('../controllers/taskController');
const { authenticate, authorize } = require('../middleware/auth');
const { createProjectRules, updateProjectRules } = require('../validators/project');
const { createTaskRules } = require('../validators/task');
const validate = require('../middleware/validate');

// All project routes require authentication
router.use(authenticate);

// Project CRUD
router.post('/', authorize('admin', 'manager'), createProjectRules, validate, createProject);
router.get('/', getProjects);
router.get('/:id', getProject);
router.put('/:id', authorize('admin', 'manager'), updateProjectRules, validate, updateProject);
router.delete('/:id', authorize('admin'), deleteProject);

// Tasks within a project
router.post('/:projectId/tasks', authorize('admin', 'manager'), createTaskRules, validate, createTask);
router.get('/:projectId/tasks', getTasks);

module.exports = router;
