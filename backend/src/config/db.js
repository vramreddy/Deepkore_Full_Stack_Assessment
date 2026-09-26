const mongoose = require('mongoose');
const config = require('./index');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    if (config.nodeEnv === 'development') {
      console.log('\n[Deepkore] External MongoDB not detected. Starting embedded in-memory MongoDB for local dev...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        const conn = await mongoose.connect(uri);
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
