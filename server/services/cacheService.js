const { LRUCache } = require('lru-cache');
const { getRedisClient } = require('./redisClient');
const logger = require('../utils/logger');

const memoryCache = new LRUCache({
  max: 10000,
  ttl: 30 * 1000,
});

const get = async (key) => {
  const redis = await getRedisClient();

  if (redis) {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.warn(`Redis cache read failed: ${error.message}`);
    }
  }

  return memoryCache.get(key) || null;
};

const set = async (key, value, ttlSeconds = 30) => {
  const redis = await getRedisClient();

  if (redis) {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return;
    } catch (error) {
      logger.warn(`Redis cache write failed: ${error.message}`);
    }
  }

  memoryCache.set(key, value, { ttl: ttlSeconds * 1000 });
};

const delByPrefix = async (prefix) => {
  const redis = await getRedisClient();

  if (redis) {
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length) {
          await redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      logger.warn(`Redis cache invalidation failed: ${error.message}`);
    }
  }

  Array.from(memoryCache.keys()).forEach((key) => {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  });
};

module.exports = {
  delByPrefix,
  get,
  set,
};
