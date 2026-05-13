const { nanoid } = require('nanoid');

const ROOM_EXPIRY_MS = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

const avatarColors = ['#245143', '#2563eb', '#7c3aed', '#c2410c', '#0f766e', '#be123c', '#0369a1', '#4d7c0f'];
const avatarAnimals = ['Spark', 'Orbit', 'Nova', 'Pulse', 'Echo', 'Vector', 'Halo', 'Wave'];

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

const createParticipantIdentity = (participantNumber = 1) => {
  const alias = `Guest-${String(participantNumber).padStart(3, '0')}`;
  const index = Math.max(0, participantNumber - 1);
  const avatarColor = avatarColors[index % avatarColors.length];
  const avatarAnimal = avatarAnimals[index % avatarAnimals.length];

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
