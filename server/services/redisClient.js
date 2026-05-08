const Redis = require('ioredis');
const config = require('../configs');
const logger = require('../utils/logger');

let client = null;
let disabledUntil = 0;

const createRedisClient = () => {
  if (!config.REDIS_URL) {
    return null;
  }

  const redis = new Redis(config.REDIS_URL, {
    enableOfflineQueue: false,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  redis.on('error', (error) => {
    logger.warn(`Redis unavailable: ${error.message}`);
  });

  return redis;
};

const getRedisClient = async () => {
  if (!config.REDIS_URL) {
    return null;
  }

  if (Date.now() < disabledUntil) {
    return null;
  }

  if (!client) {
    client = createRedisClient();
  }

  if (client.status === 'wait') {
    try {
      await client.connect();
      logger.info('Redis connected');
    } catch (error) {
      logger.warn(`Redis connection skipped: ${error.message}`);
      disabledUntil = Date.now() + 30000;
      return null;
    }
  }

  return client.status === 'ready' ? client : null;
};

const duplicateRedisClient = async () => {
  const base = await getRedisClient();

  if (!base) {
    return null;
  }

  const duplicate = base.duplicate();
  duplicate.on('error', (error) => {
    logger.warn(`Redis duplicate unavailable: ${error.message}`);
  });
  await duplicate.connect();
  return duplicate;
};

module.exports = {
  duplicateRedisClient,
  getRedisClient,
};
