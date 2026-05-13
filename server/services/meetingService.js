const jwt = require('jsonwebtoken');
const config = require('../configs');

const isMeetingConfigured = () =>
  Boolean(config.LIVEKIT_URL && config.LIVEKIT_API_KEY && config.LIVEKIT_API_SECRET);

const getLiveKitRoomName = (roomCode) => `gatherly-${roomCode}`;

const createMeetingToken = ({ roomName, identity, name, role }) => {
  if (!isMeetingConfigured()) {
    const error = new Error('Meeting service is not configured. Check LiveKit URL, API key, and API secret.');
    error.statusCode = 503;
    throw error;
  }

  const now = Math.floor(Date.now() / 1000);
  const grants = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: role === 'professional',
  };

  return jwt.sign(
    {
      iss: config.LIVEKIT_API_KEY,
      sub: identity,
      name,
      nbf: now,
      exp: now + 60 * 60 * 4,
      video: grants,
    },
    config.LIVEKIT_API_SECRET,
    { algorithm: 'HS256' }
  );
};

module.exports = {
  createMeetingToken,
  getLiveKitRoomName,
  isMeetingConfigured,
};
