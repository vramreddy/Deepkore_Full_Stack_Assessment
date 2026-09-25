const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

// Helper to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

/**
 * POST /api/auth/register
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'employee',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

/**
 * POST /api/auth/login
 * Login user and return token
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

/**
 * GET /api/auth/me
 * Get current logged-in user
 */
const getMe = async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * GET /api/auth/users
 * Get all users (admin/manager only - for dropdowns)
 */
const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter).select('name email role createdAt').sort({ name: 1 });
    res.json({ users });
  } catch (err) {
    console.error('GetUsers error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * POST /api/auth/google
 * Direct Google Mail / OAuth authentication
 */
const crypto = require('crypto');
const logActivity = require('../utils/logActivity');

const googleAuth = async (req, res) => {
  try {
    const { email, name, role = 'employee' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Valid Google email is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const randomPassword = crypto.randomBytes(16).toString('hex') + 'A1!';
      user = await User.create({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        password: randomPassword,
        role: ['admin', 'manager', 'employee'].includes(role) ? role : 'employee',
      });

      await logActivity({
        userId: user._id,
        action: 'user_registered_google',
        entityType: 'user',
        entityId: user._id,
        entityName: user.name,
        newValue: user.role,
        details: `User registered via Google Mail: ${cleanEmail}`,
      });
    }

    const token = generateToken(user._id);

    res.json({
      message: isNewUser ? 'Google account registered successfully' : 'Google login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ message: 'Server error during Google authentication.' });
  }
};

/**
 * PUT /api/auth/users/:id/role
 * Admin-only role update for Admin Panel
 */
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'manager', 'employee'].includes(role)) {
      return res.status(400).json({ message: 'Role must be admin, manager, or employee.' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const oldRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    await logActivity({
      userId: req.user._id,
      action: 'role_changed',
      entityType: 'user',
      entityId: targetUser._id,
      entityName: targetUser.name,
      previousValue: oldRole,
      newValue: role,
      details: `Admin changed role of ${targetUser.name} from ${oldRole} to ${role}`,
    });

    res.json({
      message: `Role updated to ${role} successfully.`,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ message: 'Server error updating user role.' });
  }
};

module.exports = { register, login, getMe, getUsers, googleAuth, updateUserRole };
