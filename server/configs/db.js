const config = require('./index');
const prisma = require('./prisma');
const logger = require('../utils/logger');

const connectDB = async (attempt = 1) => {
  try {
    await prisma.$connect();
    logger.info(`PostgreSQL connected on attempt ${attempt}`);
  } catch (error) {
    logger.error(`PostgreSQL connection failed on attempt ${attempt}: ${error.message}`);
    const nextAttempt = attempt + 1;
    const retryDelay = Math.min(nextAttempt * 1000, 10000);

    await new Promise((resolve) => {
      setTimeout(resolve, retryDelay);
    });

    return connectDB(nextAttempt);
  }
};

module.exports = connectDB;
