const dotenv = require('dotenv');

dotenv.config();

const rawMongoUri = (process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-ops').trim().replace(/^["']|["']$/g, '');

const config = {
  port: process.env.PORT || 5000,
  mongoUri: rawMongoUri,
  jwtSecret: (process.env.JWT_SECRET || 'fallback_dev_secret').trim().replace(/^["']|["']$/g, ''),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || '*',
  nodeEnv: process.env.NODE_ENV || 'development',
  adminClearanceKey: (process.env.ADMIN_CLEARANCE_KEY || 'DEEPKORE-ADMIN-2026').trim().replace(/^["']|["']$/g, ''),
};

module.exports = config;

