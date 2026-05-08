const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

const connectDB = async (attempt = 1) => {
  try {
    await mongoose.connect(config.MONGO_URL);
    logger.info(`MongoDB connected on attempt ${attempt}`);
  } catch (error) {
    logger.error(`MongoDB connection failed on attempt ${attempt}: ${error.message}`);
    const nextAttempt = attempt + 1;
    const retryDelay = Math.min(nextAttempt * 1000, 10000);

    await new Promise((resolve) => {
      setTimeout(resolve, retryDelay);
    });

    return connectDB(nextAttempt);
  }
};

module.exports = connectDB;
