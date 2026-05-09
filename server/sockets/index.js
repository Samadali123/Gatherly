const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { createAdapter } = require('@socket.io/redis-adapter');
const config = require('../configs');
const userModel = require('../models/user.model');
const roomService = require('../services/roomService');
const { duplicateRedisClient } = require('../services/redisClient');
const logger = require('../utils/logger');
const registerPresenceHandlers = require('./handlers/presence.handler');
const registerChatHandlers = require('./handlers/chat.handler');
const registerRoomHandlers = require('./handlers/room.handler');
const registerVideoHandlers = require('./handlers/video.handler');
const { clearParticipantDisconnectTimer } = require('./roomMeetingStore');
const { setIO } = require('./state');

const initializeSockets = (server) => {
  const io = new Server(server, {
    cors: {
      credentials: true,
      origin: config.CORS_ORIGINS,
    },
    maxHttpBufferSize: 1e6,
    pingInterval: 25000,
    pingTimeout: 20000,
  });
  setIO(io);

  if (config.REDIS_URL) {
    Promise.all([duplicateRedisClient(), duplicateRedisClient()])
      .then(([pubClient, subClient]) => {
        if (pubClient && subClient) {
          io.adapter(createAdapter(pubClient, subClient));
          logger.info('Socket.IO Redis adapter enabled');
        }
      })
      .catch((error) => {
        logger.warn(`Socket.IO Redis adapter unavailable: ${error.message}`);
      });
  }

  io.use(async (socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    const sessionId = socket.handshake.auth && socket.handshake.auth.sessionId;
    const roomCode = socket.handshake.auth && socket.handshake.auth.roomCode;

    if (sessionId && roomCode) {
      const participant = await roomService.findParticipant({ roomCode, sessionId });

      if (!participant) {
        return next(new Error('INVALID_ANON_SESSION'));
      }

      socket.authType = 'anon';
      socket.anonUser = {
        sessionId,
        roomCode,
        alias: participant.alias,
        avatarColor: participant.avatarColor,
        avatarAnimal: participant.avatarAnimal,
      };

      socket.join(`anon:${roomCode}`);
      clearParticipantDisconnectTimer(roomCode, sessionId);
      await roomService.setParticipantOnlineStatus({ roomCode, sessionId, isOnline: true });
      emitJoin(io, roomCode, participant);
      return next();
    }

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET);
      const user = await userModel.findById(decoded.userId).select('_id tokenVersion');

      if (!user || user.tokenVersion !== decoded.tokenVersion) {
        return next(new Error('INVALID_TOKEN'));
      }

      socket.user = decoded;
      socket.authType = 'jwt';
      return next();
    } catch (error) {
      const socketError = new Error(error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN');
      return next(socketError);
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    if (socket.authType === 'jwt') {
      registerPresenceHandlers(io, socket);
      registerChatHandlers(io, socket);
      registerVideoHandlers(io, socket);
    }

    if (socket.authType === 'anon') {
      registerRoomHandlers(io, socket);
    }

  });

  return io;
};

const emitJoin = (io, roomCode, participant) => {
  io.to(`anon:${roomCode}`).emit('room:joined', {
    roomCode,
    sessionId: participant.sessionId,
    alias: participant.alias,
  });
};

module.exports = initializeSockets;
