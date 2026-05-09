const sortedParticipants = (left, right) => [left, right].sort();

const buildDirectChatId = (left, right) => `dm:${sortedParticipants(left, right).join(':')}`;

const buildLegacyDirectChatId = (left, right) => ['dm', left, right].sort().join(':');

const buildDirectChatIds = (left, right) =>
  Array.from(new Set([buildDirectChatId(left, right), buildLegacyDirectChatId(left, right)]));

const isDirectChatId = (chatId = '') =>
  typeof chatId === 'string' && (chatId.startsWith('dm:') || chatId.endsWith(':dm') || chatId.includes(':dm:'));

const getDirectChatParticipants = (chatId = '') =>
  isDirectChatId(chatId) ? chatId.split(':').filter((part) => part && part !== 'dm') : [];

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
  buildDirectChatIds,
  getDirectChatParticipants,
  computeExpiresAt,
  isDirectChatId,
  ttlToMs,
};
