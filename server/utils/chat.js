const buildDirectChatId = (left, right) => ['dm', left, right].sort().join(':');

const ttlToMs = {
  '5m': 5 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

const computeExpiresAt = (ttl) => {
  if (!ttl || !ttlToMs[ttl]) {
    return null;
  }

  return new Date(Date.now() + ttlToMs[ttl]);
};

module.exports = {
  buildDirectChatId,
  computeExpiresAt,
  ttlToMs,
};
