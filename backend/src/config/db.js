const mongoose = require('mongoose');
const config = require('./index');

const connectDB = async () => {
  const uri = config.mongoUri;

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    console.error('\n❌ [CRITICAL DATABASE CONFIG ERROR]');
    console.error(`Invalid MONGO_URI provided in Environment Variables: "${uri}"`);
    console.error('MONGO_URI must begin with "mongodb://" or "mongodb+srv://".');
    console.error('Example: mongodb+srv://myUser:myPassword@cluster0.abcde.mongodb.net/smart-ops?retryWrites=true&w=majority\n');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[Deepkore] MongoDB connected successfully: ${conn.connection.host}`);

    // Auto-seed if database is fresh (0 users)
    try {
      const User = require('../models/User');
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('[Deepkore] Fresh database detected. Auto-seeding initial users and projects...');
        const seedData = require('../utils/seed');
        await seedData();
        console.log('[Deepkore] Auto-seeding complete! Default accounts ready.');
      }
    } catch (seedErr) {
      console.warn('[Deepkore] Auto-seed check skipped:', seedErr.message);
    }
  } catch (err) {
    if (config.nodeEnv === 'development') {
      console.log('\n[Deepkore] External MongoDB not detected. Starting embedded in-memory MongoDB for local dev...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memUri = mongod.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`[Deepkore] Embedded MongoDB running and connected: ${conn.connection.host}`);

        // Seed with test data
        const seedData = require('../utils/seed');
        await seedData();
        return;
      } catch (memErr) {
        console.error('[Deepkore] In-memory MongoDB failed to start:', memErr.message);
      }
    }
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
