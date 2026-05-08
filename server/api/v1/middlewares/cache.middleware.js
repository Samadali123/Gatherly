const cacheService = require('../../../services/cacheService');

const makeCacheKey = (req, varyByUser = true) => {
  const userKey = varyByUser && req.user?.userId ? `user:${req.user.userId}` : 'public';
  const anonKey = req.anonUser?.sessionId ? `anon:${req.anonUser.roomCode}:${req.anonUser.sessionId}` : '';
  return `http:${userKey}:${anonKey}:${req.originalUrl}`;
};

const cacheResponse = ({ ttlSeconds = 30, varyByUser = true } = {}) => async (req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }

  const key = makeCacheKey(req, varyByUser);
  const cached = await cacheService.get(key);

  if (cached) {
    res.set('X-Cache', 'HIT');
    return res.status(cached.status).json(cached.body);
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      cacheService.set(key, { body, status: res.statusCode }, ttlSeconds).catch(() => {});
    }
    res.set('X-Cache', 'MISS');
    return originalJson(body);
  };

  return next();
};

module.exports = {
  cacheResponse,
};
