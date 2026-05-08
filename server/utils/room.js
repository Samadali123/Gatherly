const { nanoid } = require('nanoid');

const ROOM_EXPIRY_MS = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

const avatarColors = ['amber', 'emerald', 'sky', 'rose', 'violet', 'orange'];
const avatarAnimals = ['Fox', 'Otter', 'Panda', 'Hawk', 'Tiger', 'Koala'];

const generateRoomCode = () => nanoid(10);
const generateSessionId = () => nanoid(24);

const getRoomExpiryDate = (duration = '24h') => {
  const ms = ROOM_EXPIRY_MS[duration] || ROOM_EXPIRY_MS['24h'];
  return new Date(Date.now() + ms);
};

const getRoomExpiryFromInput = (expiresAt, duration = '24h') => {
  if (expiresAt) {
    return new Date(expiresAt);
  }

  return getRoomExpiryDate(duration);
};

const createParticipantIdentity = () => {
  const alias = `Guest-${nanoid(6)}`;
  const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
  const avatarAnimal = avatarAnimals[Math.floor(Math.random() * avatarAnimals.length)];

  return { alias, avatarColor, avatarAnimal };
};

module.exports = {
  ROOM_EXPIRY_MS,
  generateRoomCode,
  generateSessionId,
  getRoomExpiryDate,
  getRoomExpiryFromInput,
  createParticipantIdentity,
};
