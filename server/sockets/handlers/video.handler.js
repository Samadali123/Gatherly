const { customAlphabet } = require('nanoid');
const callService = require('../../services/callService');
const chatService = require('../../services/chatService');
const userService = require('../../services/userService');
const logger = require('../../utils/logger');

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);
const registeredUsers = new Map();
const ringingTimers = new Map();
const callMeta = new Map();
const callAttempts = new Map();
const anonymousQueue = [];
const anonymousPeers = new Map();
const roomParticipants = new Map();

const addRegisteredSocket = (userId, socketId) => {
  const key = String(userId);
  const sockets = registeredUsers.get(key) || new Set();
  sockets.add(socketId);
  registeredUsers.set(key, sockets);
};

const removeRegisteredSocket = (userId, socketId) => {
  const key = String(userId);
  const sockets = registeredUsers.get(key);

  if (!sockets) {
    return;
  }

  sockets.delete(socketId);

  if (!sockets.size) {
    registeredUsers.delete(key);
  }
};

const getUserSocketIds = async (userId) => {
  const direct = Array.from(registeredUsers.get(String(userId)) || []);
  const user = await userService.findById(userId);
  const stored = user?.socketId ? [user.socketId] : [];
  return Array.from(new Set([...direct, ...stored]));
};

const clearRingingTimer = (callId) => {
  const timer = ringingTimers.get(callId);

  if (timer) {
    clearTimeout(timer);
    ringingTimers.delete(callId);
  }
};

const canStartCall = (socketId) => {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxCalls = 8;
  const attempts = (callAttempts.get(socketId) || []).filter((timestamp) => now - timestamp < windowMs);

  if (attempts.length >= maxCalls) {
    callAttempts.set(socketId, attempts);
    return false;
  }

  attempts.push(now);
  callAttempts.set(socketId, attempts);
  return true;
};

const formatDuration = (seconds = 0) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
};

const emitCallMessage = async (io, meta, text, status, duration = 0) => {
  if (!meta?.caller || !meta?.receiver || !text) {
    return null;
  }

  const { message } = await chatService.createMessage({
    message: text,
    senderUser: meta.caller,
    receiver: meta.receiver.username || meta.receiver.email,
    attachments: [],
    statusContext: {
      type: 'text',
      text: status || 'call',
    },
  });

  const payload = {
    chatId: message.chatId,
    message,
    messageId: message._id,
  };
  const socketIds = await Promise.all([
    getUserSocketIds(meta.caller._id),
    getUserSocketIds(meta.receiver._id),
  ]);

  socketIds.flat().forEach((socketId) => io.to(socketId).emit('receive-private-message', payload));
  return message;
};

const finishCallWithMessage = async (io, callId, status, reason = status) => {
  const meta = callMeta.get(callId);
  const duration = meta?.connectedAt ? Math.max(0, Math.floor((Date.now() - meta.connectedAt) / 1000)) : 0;

  if (meta) {
    let text = 'Call ended';

    if (status === 'missed' || status === 'rejected') {
      text = `${meta.receiver.name || meta.receiver.username || 'User'} did not answer the call.`;
    } else if (reason === 'disconnected') {
      text = `Call disconnected${duration ? ` after ${formatDuration(duration)}` : ''}.`;
    } else if (duration) {
      text = `Call ended. Duration ${formatDuration(duration)}.`;
    }

    await emitCallMessage(io, meta, text, status, duration);
    callMeta.delete(callId);
  }

  return duration;
};

const removeFromAnonymousQueue = (socketId) => {
  const index = anonymousQueue.findIndex((entry) => entry.socketId === socketId);

  if (index !== -1) {
    anonymousQueue.splice(index, 1);
  }
};

const clearAnonymousPeer = (io, socketId) => {
  const match = anonymousPeers.get(socketId);

  if (!match) {
    return;
  }

  anonymousPeers.delete(socketId);
  anonymousPeers.delete(match.peerSocketId);
  io.to(match.peerSocketId).emit('anonymous-peer-left');
};

const enqueueAnonymous = (io, socket) => {
  removeFromAnonymousQueue(socket.id);
  clearAnonymousPeer(io, socket.id);

  const waiting = anonymousQueue.shift();

  if (!waiting || waiting.socketId === socket.id) {
    anonymousQueue.push({
      anonymousId: socket.videoUser.anonymousId,
      socketId: socket.id,
    });
    socket.emit('waiting-for-match');
    return;
  }

  const roomId = `anon-video-${nanoid()}`;
  const current = {
    anonymousId: socket.videoUser.anonymousId,
    peerAnonymousId: waiting.anonymousId,
    peerSocketId: waiting.socketId,
    roomId,
  };
  const peer = {
    anonymousId: waiting.anonymousId,
    peerAnonymousId: socket.videoUser.anonymousId,
    peerSocketId: socket.id,
    roomId,
  };

  anonymousPeers.set(socket.id, current);
  anonymousPeers.set(waiting.socketId, peer);
  socket.join(roomId);
  io.sockets.sockets.get(waiting.socketId)?.join(roomId);

  io.to(waiting.socketId).emit('match-found', {
    initiator: true,
    peerId: socket.videoUser.anonymousId,
    peerSocketId: socket.id,
    roomId,
  });
  socket.emit('match-found', {
    initiator: false,
    peerId: waiting.anonymousId,
    peerSocketId: waiting.socketId,
    roomId,
  });
};

const leaveVideoRoom = (io, socket, roomId) => {
  const participants = roomParticipants.get(roomId);

  if (!participants) {
    return;
  }

  participants.delete(socket.id);
  socket.leave(roomId);
  socket.to(roomId).emit('room-peer-left', {
    socketId: socket.id,
    userId: socket.videoUser?.userId || socket.videoUser?.anonymousId,
  });

  if (!participants.size) {
    roomParticipants.delete(roomId);
  }
};

const registerVideoHandlers = (io, socket) => {
  socket.on('register', async ({ userId } = {}) => {
    if (socket.authType !== 'jwt' || String(userId) !== String(socket.user.userId)) {
      return;
    }

    addRegisteredSocket(userId, socket.id);
    socket.videoUser = {
      displayName: socket.user.username || socket.user.email || 'User',
      userId: String(userId),
    };
    await userService.updateSocketId(userId, socket.id);
  });

  socket.on('call-user', async ({ receiverId } = {}) => {
    try {
      if (socket.authType !== 'jwt' || !receiverId) {
        return;
      }

      if (!canStartCall(socket.id)) {
        socket.emit('call-error', { message: 'Too many call attempts. Try again in a minute.' });
        return;
      }

      const [caller, receiver, receiverSocketIds] = await Promise.all([
        userService.findById(socket.user.userId),
        userService.findById(receiverId),
        getUserSocketIds(receiverId),
      ]);

      if (!caller || !receiver) {
        socket.emit('call-error', { message: 'User not found' });
        return;
      }

      const call = await callService.createCall({
        callerId: caller._id,
        receiverId: receiver._id,
        status: receiverSocketIds.length ? 'ringing' : 'missed',
      });
      callMeta.set(call.callId, { caller, receiver, startedAt: Date.now() });

      if (!receiverSocketIds.length) {
        await callService.finishCall(call.callId, 'missed');
        await finishCallWithMessage(io, call.callId, 'missed');
        socket.emit('call-ended', {
          callId: call.callId,
          peer: { displayName: receiver.name || receiver.username || receiver.email, id: receiver._id.toString(), username: receiver.username },
          reason: 'missed',
        });
        return;
      }

      socket.join(call.roomId);
      receiverSocketIds.forEach((receiverSocketId) => io.to(receiverSocketId).emit('incoming-call', {
        callId: call.callId,
        caller: {
          displayName: caller.name || caller.username || caller.email,
          id: caller._id.toString(),
        },
        callerId: caller._id.toString(),
        roomId: call.roomId,
      }));
      ringingTimers.set(
        call.callId,
        setTimeout(async () => {
          ringingTimers.delete(call.callId);
          await callService.finishCall(call.callId, 'missed');
          await finishCallWithMessage(io, call.callId, 'missed');
          const payload = {
            callId: call.callId,
            peer: { displayName: receiver.name || receiver.username || receiver.email, id: receiver._id.toString(), username: receiver.username },
            reason: 'missed',
          };
          socket.emit('call-ended', payload);
          receiverSocketIds.forEach((receiverSocketId) => io.to(receiverSocketId).emit('call-ended', { ...payload, peer: { displayName: caller.name || caller.username || caller.email, id: caller._id.toString(), username: caller.username } }));
        }, 30000)
      );
      socket.emit('call-ringing', {
        callId: call.callId,
        receiverId: receiver._id.toString(),
        roomId: call.roomId,
      });
    } catch (error) {
      logger.error(`call-user failed: ${error.message}`);
      socket.emit('call-error', { message: 'Unable to start call' });
    }
  });

  socket.on('accept-call', async ({ callId, roomId, callerId } = {}) => {
    try {
      if (!callId || !roomId) {
        return;
      }

      clearRingingTimer(callId);
      socket.join(roomId);
      await callService.markConnected(callId);
      const meta = callMeta.get(callId);
      if (meta) {
        meta.connectedAt = Date.now();
        await emitCallMessage(io, meta, 'Call started', 'connected');
      }
      const callerSocketIds = callerId ? await getUserSocketIds(callerId) : [];
      socket.emit('call-accepted', { callId, roomId });
      if (callerSocketIds.length) {
        callerSocketIds.forEach((callerSocketId) => io.to(callerSocketId).emit('call-accepted', { callId, roomId }));
      } else {
        socket.to(roomId).emit('call-accepted', { callId, roomId });
      }
    } catch (error) {
      logger.error(`accept-call failed: ${error.message}`);
    }
  });

  socket.on('reject-call', async ({ callId, callerId, roomId } = {}) => {
    try {
      if (callId) {
        clearRingingTimer(callId);
        await callService.finishCall(callId, 'rejected');
        await finishCallWithMessage(io, callId, 'rejected');
      }

      const callerSocketIds = callerId ? await getUserSocketIds(callerId) : [];
      callerSocketIds.forEach((callerSocketId) => io.to(callerSocketId).emit('call-rejected', { callId, reason: 'rejected', roomId }));
      socket.emit('call-ended', { callId, reason: 'rejected' });
    } catch (error) {
      logger.error(`reject-call failed: ${error.message}`);
    }
  });

  socket.on('offer', ({ roomId, offer, to } = {}) => {
    if (!roomId || !offer) return;
    const payload = { from: socket.id, offer, roomId };
    to ? io.to(to).emit('offer', payload) : socket.to(roomId).emit('offer', payload);
  });

  socket.on('answer', ({ roomId, answer, to } = {}) => {
    if (!roomId || !answer) return;
    const payload = { answer, from: socket.id, roomId };
    to ? io.to(to).emit('answer', payload) : socket.to(roomId).emit('answer', payload);
  });

  socket.on('ice-candidate', ({ roomId, candidate, to } = {}) => {
    if (!roomId || !candidate) return;
    const payload = { candidate, from: socket.id, roomId };
    to ? io.to(to).emit('ice-candidate', payload) : socket.to(roomId).emit('ice-candidate', payload);
  });

  socket.on('end-call', async ({ callId, roomId, reason = 'ended' } = {}) => {
    let duration = 0;
    if (callId) {
      clearRingingTimer(callId);
      const status = reason === 'missed' ? 'missed' : 'ended';
      await callService.finishCall(callId, status);
      duration = await finishCallWithMessage(io, callId, status, reason);
      socket.emit('call-ended', { callId, duration, reason });
    }

    if (roomId) {
      socket.to(roomId).emit('call-ended', { callId, duration, reason });
      socket.leave(roomId);
    }
  });

  socket.on('join-queue', () => {
    if (socket.authType !== 'anonymous-video') {
      return;
    }

    enqueueAnonymous(io, socket);
  });

  socket.on('next-user', () => {
    if (socket.authType !== 'anonymous-video') {
      return;
    }

    enqueueAnonymous(io, socket);
  });

  socket.on('join-room', ({ roomId, displayName } = {}) => {
    if (socket.authType !== 'anonymous-video' || !roomId) {
      return;
    }

    const participant = {
      displayName: displayName || socket.videoUser?.displayName || 'Guest',
      socketId: socket.id,
      userId: socket.videoUser?.userId || socket.videoUser?.anonymousId || socket.id,
    };
    const participants = roomParticipants.get(roomId) || new Map();
    const existingPeers = Array.from(participants.values());

    participants.set(socket.id, participant);
    roomParticipants.set(roomId, participants);
    socket.join(roomId);
    socket.emit('room-joined', { peers: existingPeers, roomId });
    socket.to(roomId).emit('room-peer-joined', participant);
  });

  socket.on('leave-room', ({ roomId } = {}) => {
    if (roomId) {
      leaveVideoRoom(io, socket, roomId);
    }
  });

  socket.on('disconnect', () => {
    if (socket.authType === 'jwt') {
      removeRegisteredSocket(socket.user.userId, socket.id);
      callAttempts.delete(socket.id);
    }

    if (socket.authType === 'anonymous-video') {
      removeFromAnonymousQueue(socket.id);
      clearAnonymousPeer(io, socket.id);
    }

    Array.from(roomParticipants.keys()).forEach((roomId) => leaveVideoRoom(io, socket, roomId));
  });
};

module.exports = registerVideoHandlers;
