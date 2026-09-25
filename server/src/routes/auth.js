const express = require('express');
const router = express.Router();
const { register, login, getMe, getUsers } = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');
const { registerRules, loginRules } = require('../validators/auth');
const validate = require('../middleware/validate');

// Public routes
router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);

// Protected routes
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, authorize('admin', 'manager'), getUsers);

module.exports = router;
