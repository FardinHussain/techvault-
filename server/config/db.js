const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  try {
    if (isConnected) {
      console.log('⚡ MongoDB already connected');
      return true;
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'techvault', // ensure DB name
      serverSelectionTimeoutMS: 5000,
    });

    // 🔥 Wait until connection is fully ready
    await new Promise((resolve, reject) => {
      if (conn.connection.readyState === 1) {
        return resolve();
      }

      conn.connection.once('connected', resolve);
      conn.connection.once('error', reject);
    });

    isConnected = true;

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;

  } catch (error) {
    isConnected = false;

    console.error(`❌ MongoDB connection failed: ${error.message}`);
    console.warn('⚠️ Running in FALLBACK mode — using local JSON');

    return false;
  }
};

const getConnectionStatus = () => isConnected;

module.exports = { connectDB, getConnectionStatus };