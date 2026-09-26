const dotenv = require('dotenv');

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/smart-ops',
  jwtSecret: process.env.JWT_SECRET || 'fallback_dev_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  adminClearanceKey: process.env.ADMIN_CLEARANCE_KEY || 'DEEPKORE-ADMIN-2026',
};

module.exports = config;
