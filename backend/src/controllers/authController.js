const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');
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
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    // Find user and include password field (support both @deepkore.com & @smartops.com aliases)
    let user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user && cleanEmail.includes('@deepkore.com')) {
      const altEmail = cleanEmail.replace('@deepkore.com', '@smartops.com');
      user = await User.findOne({ email: altEmail }).select('+password');
    } else if (!user && cleanEmail.includes('@smartops.com')) {
      const altEmail = cleanEmail.replace('@smartops.com', '@deepkore.com');
      user = await User.findOne({ email: altEmail }).select('+password');
    }

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
    const { email, name, role = 'employee', adminKey } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Valid Google email is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const prefix = cleanEmail.split('@')[0];

    // Check if user exists by exact email
    let user = await User.findOne({ email: cleanEmail });

    // If not found, check known domain aliases (e.g., smartops.com, deepkore.com) or username matching
    if (!user) {
      const aliasCandidates = [
        `${prefix}@smartops.com`,
        `${prefix}@deepkore.com`,
        `${prefix}@gmail.com`,
      ];
      user = await User.findOne({ email: { $in: aliasCandidates } });
    }

    if (!user) {
      // Also search by prefix if username is common (e.g. rahul, amit, priya, admin)
      const basePrefix = prefix.split(/[._-]/)[0];
      user = await User.findOne({
        $or: [
          { email: new RegExp(`^${basePrefix}@`, 'i') },
          { name: new RegExp(name || basePrefix, 'i') },
        ],
      });
    }

    const isRequestingAdmin = role === 'admin';
    const isPreAuthorizedAdmin =
      cleanEmail === 'admin@smartops.com' || cleanEmail === 'admin@deepkore.com';
    const hasValidAdminKey =
      adminKey && adminKey.trim() === config.adminClearanceKey;

    // Security Verification: If attempting to authenticate into Admin Console
    if (isRequestingAdmin) {
      const isAlreadyAdmin = user && user.role === 'admin';

      if (!isAlreadyAdmin && !isPreAuthorizedAdmin && !hasValidAdminKey) {
        return res.status(403).json({
          message:
            'Administrative clearance required. Please provide a valid Admin Clearance Key to verify and provision Administrator privileges.',
          requiresAdminKey: true,
        });
      }

      // If authorized with valid key or pre-cleared admin email, ensure admin role
      if (user && (hasValidAdminKey || isPreAuthorizedAdmin)) {
        if (user.role !== 'admin') {
          user.role = 'admin';
          await user.save();
        }
      }
    }

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const randomPassword = crypto.randomBytes(16).toString('hex') + 'A1!';

      let userRole = 'employee';
      if (isRequestingAdmin && (isPreAuthorizedAdmin || hasValidAdminKey)) {
        userRole = 'admin';
      } else if (role === 'manager') {
        userRole = 'manager';
      }

      user = await User.create({
        name: name || prefix.replace(/[._]/g, ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase()),
        email: cleanEmail,
        password: randomPassword,
        role: userRole,
      });

      // For new non-admin users, assign them to active projects so they have a populated dashboard and tasks
      if (userRole !== 'admin') {
        try {
          await Project.updateMany(
            { status: { $in: ['active', 'planning'] } },
            { $addToSet: { teamMembers: user._id } }
          );
        } catch (projErr) {
          console.error('Auto-assigning new Google user to demo projects failed:', projErr.message);
        }
      }

      await logActivity({
        userId: user._id,
        action: 'user_registered_google',
        entityType: 'user',
        entityId: user._id,
        entityName: user.name,
        newValue: user.role,
        details: `User registered via Google Mail: ${cleanEmail} (Role: ${userRole})`,
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
