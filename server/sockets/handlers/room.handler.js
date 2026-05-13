const roomService = require('../../services/roomService');
const logger = require('../../utils/logger');
const { emitToSocket } = require('../emitter');
const {
  addMeetingParticipant,
  endMeeting,
  getMeeting,
  publicMeeting,
  removeMeetingParticipant,
  scheduleParticipantDisconnect,
  setMeeting,
} = require('../roomMeetingStore');

const notifyParticipantLeft = (io, meeting, participant) => {
  if (!meeting || !participant || participant.sessionId === meeting.hostSessionId) {
    return;
  }

  if (meeting.hostSocketId) {
    io.to(meeting.hostSocketId).emit('participant_left_notify', {
      displayName: participant.displayName || 'Participant',
      timestamp: Date.now(),
    });
  }

  io.to(`anon:${meeting.roomCode}`).emit('participant_list_update', {
    userId: participant.sessionId,
    action: 'left',
  });

  emitToSocket(`anon:${meeting.roomCode}`, 'room:meeting:state', publicMeeting(meeting));
};

const requireRoomParticipant = async (socket) => {
  const participant = await roomService.findParticipant({
    roomCode: socket.anonUser.roomCode,
    sessionId: socket.anonUser.sessionId,
  });

  if (!participant) {
    socket.emit('room:participant:kicked', {
      sessionId: socket.anonUser.sessionId,
      message: 'You are no longer in this room.',
    });
    return null;
  }

  return participant;
};

const emitRoomActionError = (socket, error) => {
  const message = error?.statusCode === 410
    ? 'Time ended for this room. Sorry, nobody can chat here now.'
    : error?.message || 'Unable to complete this room action.';
  socket.emit('room:error', { message });
};

const registerRoomHandlers = (io, socket) => {
  if (socket.authType !== 'anon') {
    return;
  }

  socket.on('room:message:send', async ({ content = '', parentMessageId = null, attachments = [] }) => {
    try {
      const room = await roomService.findRoomByCode(socket.anonUser.roomCode);
      const participant = await requireRoomParticipant(socket);

      if (!room || !participant || (!content && !attachments.length)) {
        return;
      }

      const message = await roomService.createAnonMessage({ room, participant, content, parentMessageId, attachments });
      emitToSocket(`anon:${room.code}`, 'room:message:new', roomService.serializeAnonMessage(message));
    } catch (error) {
      emitRoomActionError(socket, error);
      logger.error(`room:message:send failed: ${error.message}`);
    }
  });

  socket.on('room:message:react', async ({ messageId, emoji }) => {
    try {
      if (!messageId || !emoji) {
        return;
      }

      if (!(await requireRoomParticipant(socket))) {
        return;
      }

      const message = await roomService.reactToAnonMessage({
        roomCode: socket.anonUser.roomCode,
        messageId,
        sessionId: socket.anonUser.sessionId,
        emoji,
      });

      if (message) {
        emitToSocket(`anon:${socket.anonUser.roomCode}`, 'room:message:updated', message);
      }
    } catch (error) {
      emitRoomActionError(socket, error);
      logger.error(`room:message:react failed: ${error.message}`);
    }
  });

  socket.on('room:message:pin', async ({ messageId }) => {
    try {
      if (!(await requireRoomParticipant(socket))) {
        return;
      }

      const message = await roomService.pinAnonMessage({
        roomCode: socket.anonUser.roomCode,
        messageId,
        sessionId: socket.anonUser.sessionId,
      });

      if (message) {
        emitToSocket(`anon:${socket.anonUser.roomCode}`, 'room:message:updated', message);
      }
    } catch (error) {
      emitRoomActionError(socket, error);
      logger.error(`room:message:pin failed: ${error.message}`);
    }
  });

  socket.on('room:message:unpin', async ({ messageId }) => {
    try {
      if (!(await requireRoomParticipant(socket))) {
        return;
      }

      const message = await roomService.unpinAnonMessage({
        roomCode: socket.anonUser.roomCode,
        messageId,
        sessionId: socket.anonUser.sessionId,
      });

      if (message) {
        emitToSocket(`anon:${socket.anonUser.roomCode}`, 'room:message:updated', message);
      }
    } catch (error) {
      emitRoomActionError(socket, error);
      logger.error(`room:message:unpin failed: ${error.message}`);
    }
  });

  socket.on('room:poll:create', async ({ question, options }) => {
    try {
      const room = await roomService.findRoomByCode(socket.anonUser.roomCode);
      const participant = await requireRoomParticipant(socket);

      if (!room || !participant || !question || !Array.isArray(options) || options.filter(Boolean).length < 2) {
        return;
      }

      const poll = await roomService.createAnonPoll({
        room,
        participant,
        question,
        options: options.map((option) => option.trim()).filter(Boolean),
      });

      emitToSocket(`anon:${room.code}`, 'room:poll:new', poll);
    } catch (error) {
      emitRoomActionError(socket, error);
      logger.error(`room:poll:create failed: ${error.message}`);
    }
  });

  socket.on('room:poll:vote', async ({ pollId, optionId }) => {
    try {
      if (!(await requireRoomParticipant(socket))) {
        return;
      }

      const poll = await roomService.voteAnonPoll({
        roomCode: socket.anonUser.roomCode,
        pollId,
        optionId,
        sessionId: socket.anonUser.sessionId,
      });

      if (poll) {
        emitToSocket(`anon:${socket.anonUser.roomCode}`, 'room:poll:updated', poll);
      }
    } catch (error) {
      emitRoomActionError(socket, error);
      logger.error(`room:poll:vote failed: ${error.message}`);
    }
  });

  socket.on('room:meeting:state:request', () => {
    socket.emit('room:meeting:state', publicMeeting(getMeeting(socket.anonUser.roomCode)));
  });

  socket.on('room:meeting:start', async () => {
    if (!(await requireRoomParticipant(socket))) {
      return;
    }

    const meeting = {
      roomCode: socket.anonUser.roomCode,
      hostSessionId: socket.anonUser.sessionId,
      hostAlias: socket.anonUser.alias,
      hostSocketId: socket.id,
      startedAt: new Date().toISOString(),
      pending: new Map(),
      approved: new Set([socket.anonUser.sessionId]),
      activeParticipants: new Map(),
    };

    meeting.activeParticipants.set(socket.anonUser.sessionId, {
      displayName: socket.anonUser.alias,
      sessionId: socket.anonUser.sessionId,
      socketId: socket.id,
    });
    setMeeting(socket.anonUser.roomCode, meeting);
    emitToSocket(`anon:${socket.anonUser.roomCode}`, 'room:meeting:state', publicMeeting(meeting));
  });

  socket.on('room:meeting:join-request', async () => {
    if (!(await requireRoomParticipant(socket))) {
      return;
    }

    const meeting = getMeeting(socket.anonUser.roomCode);

    if (!meeting) {
      socket.emit('room:meeting:ended');
      return;
    }

    if (meeting.approved.has(socket.anonUser.sessionId)) {
      socket.emit('room:meeting:approved', { roomCode: socket.anonUser.roomCode });
      return;
    }

    const request = {
      sessionId: socket.anonUser.sessionId,
      alias: socket.anonUser.alias,
      requestedAt: new Date().toISOString(),
    };

    meeting.pending.set(socket.anonUser.sessionId, request);
    emitToSocket(`anon:${socket.anonUser.roomCode}`, 'room:meeting:state', publicMeeting(meeting));
    socket.emit('room:meeting:waiting', request);
  });

  socket.on('room:meeting:approve', async ({ sessionId }) => {
    if (!(await requireRoomParticipant(socket))) {
      return;
    }

    const meeting = getMeeting(socket.anonUser.roomCode);

    if (!meeting || meeting.hostSessionId !== socket.anonUser.sessionId || !sessionId) {
      return;
    }

    meeting.pending.delete(sessionId);
    meeting.approved.add(sessionId);
    emitToSocket(`anon:${socket.anonUser.roomCode}`, 'room:meeting:state', publicMeeting(meeting));
    emitToSocket(`anon:${socket.anonUser.roomCode}`, 'room:meeting:approved', { sessionId, roomCode: socket.anonUser.roomCode });
  });

  socket.on('room:meeting:deny', async ({ sessionId }) => {
    if (!(await requireRoomParticipant(socket))) {
      return;
    }

    const meeting = getMeeting(socket.anonUser.roomCode);

    if (!meeting || meeting.hostSessionId !== socket.anonUser.sessionId || !sessionId) {
      return;
    }

    meeting.pending.delete(sessionId);
    emitToSocket(`anon:${socket.anonUser.roomCode}`, 'room:meeting:state', publicMeeting(meeting));
    emitToSocket(`anon:${socket.anonUser.roomCode}`, 'room:meeting:denied', { sessionId, roomCode: socket.anonUser.roomCode });
  });

  const emitHostControl = async ({ sessionId, event }) => {
    if (!(await requireRoomParticipant(socket))) {
      return;
    }

    const meeting = getMeeting(socket.anonUser.roomCode);
    const target = meeting?.activeParticipants?.get(sessionId);

    if (!meeting || meeting.hostSessionId !== socket.anonUser.sessionId || !target?.socketId) {
      return;
    }

    io.to(target.socketId).emit(event, {
      sessionId,
      roomCode: socket.anonUser.roomCode,
    });
  };

  socket.on('room:meeting:force-mute', ({ sessionId }) => {
    emitHostControl({ sessionId, event: 'room:meeting:force-muted' });
  });

  socket.on('room:meeting:force-camera-off', ({ sessionId }) => {
    emitHostControl({ sessionId, event: 'room:meeting:force-camera-off' });
  });

  socket.on('room:meeting:remove-participant', async ({ sessionId }) => {
    await emitHostControl({ sessionId, event: 'room:meeting:removed' });
    const departed = removeMeetingParticipant(socket.anonUser.roomCode, sessionId);
    if (departed) {
      notifyParticipantLeft(io, departed.meeting, departed.participant);
    }
  });

  socket.on('room:meeting:end', async () => {
    if (!(await requireRoomParticipant(socket))) {
      return;
    }

    const meeting = getMeeting(socket.anonUser.roomCode);

    if (!meeting || meeting.hostSessionId !== socket.anonUser.sessionId) {
      return;
    }

    endMeeting(socket.anonUser.roomCode, socket.anonUser.sessionId);
    emitToSocket(`anon:${socket.anonUser.roomCode}`, 'room:meeting:ended');
    emitToSocket(`anon:${socket.anonUser.roomCode}`, 'meeting_ended', { meetingId: socket.anonUser.roomCode });
    emitToSocket(`anon:${socket.anonUser.roomCode}`, 'room:meeting:state', publicMeeting(null));
  });

  socket.on('room:deleted:ack', () => {
    socket.disconnect(true);
  });

  socket.on('meeting_ended', async ({ meetingId } = {}) => {
    if (!(await requireRoomParticipant(socket))) {
      return;
    }

    const meeting = getMeeting(socket.anonUser.roomCode);

    if (!meeting || meeting.hostSessionId !== socket.anonUser.sessionId) {
      return;
    }

    endMeeting(socket.anonUser.roomCode, socket.anonUser.sessionId);
    emitToSocket(`anon:${socket.anonUser.roomCode}`, 'room:meeting:ended');
    emitToSocket(`anon:${socket.anonUser.roomCode}`, 'meeting_ended', { meetingId: meetingId || socket.anonUser.roomCode });
    emitToSocket(`anon:${socket.anonUser.roomCode}`, 'room:meeting:state', publicMeeting(null));
  });

  socket.on('whiteboard_opened', async ({ meetingId } = {}) => {
    if (!(await requireRoomParticipant(socket))) {
      return;
    }

    const meeting = getMeeting(socket.anonUser.roomCode);

    if (!meeting || meeting.hostSessionId !== socket.anonUser.sessionId) {
      return;
    }

    socket.to(`anon:${socket.anonUser.roomCode}`).emit('whiteboard_opened', { meetingId: meetingId || socket.anonUser.roomCode });
  });

  socket.on('whiteboard_closed', async ({ meetingId } = {}) => {
    if (!(await requireRoomParticipant(socket))) {
      return;
    }

    const meeting = getMeeting(socket.anonUser.roomCode);

    if (!meeting || meeting.hostSessionId !== socket.anonUser.sessionId) {
      return;
    }

    socket.to(`anon:${socket.anonUser.roomCode}`).emit('whiteboard_closed', { meetingId: meetingId || socket.anonUser.roomCode });
  });

  socket.on('whiteboard_change', async ({ meetingId, changes } = {}) => {
    if (!(await requireRoomParticipant(socket))) {
      return;
    }

    if (!changes) {
      return;
    }

    const roomMeetingId = meetingId === socket.anonUser.roomCode || !meetingId ? `anon:${socket.anonUser.roomCode}` : meetingId;

    if (roomMeetingId !== `anon:${socket.anonUser.roomCode}`) {
      return;
    }

    socket.to(roomMeetingId).emit('whiteboard_change', { changes });
  });

  socket.on('participant_joined', async ({ displayName } = {}) => {
    if (!(await requireRoomParticipant(socket))) {
      return;
    }

    const meeting = addMeetingParticipant({
      roomCode: socket.anonUser.roomCode,
      sessionId: socket.anonUser.sessionId,
      displayName: displayName || socket.anonUser.alias,
      socketId: socket.id,
    });

    if (meeting) {
      emitToSocket(`anon:${socket.anonUser.roomCode}`, 'room:meeting:state', publicMeeting(meeting));
    }
  });

  socket.on('participant_left', async ({ userId, displayName } = {}) => {
    if (!(await requireRoomParticipant(socket))) {
      return;
    }

    const meeting = getMeeting(socket.anonUser.roomCode);
    const sessionId = userId || socket.anonUser.sessionId;

    if (!meeting || sessionId === meeting.hostSessionId || sessionId !== socket.anonUser.sessionId) {
      return;
    }

    const departed = removeMeetingParticipant(socket.anonUser.roomCode, sessionId);

    if (departed) {
      departed.participant.displayName = displayName || departed.participant.displayName || socket.anonUser.alias;
      notifyParticipantLeft(io, departed.meeting, departed.participant);
    }
  });

  socket.on('disconnect', async () => {
    try {
      scheduleParticipantDisconnect({
        roomCode: socket.anonUser.roomCode,
        sessionId: socket.anonUser.sessionId,
        onDeparted: ({ meeting, participant }) => notifyParticipantLeft(io, meeting, participant),
      });

      const participant = await roomService.setParticipantOnlineStatus({
        roomCode: socket.anonUser.roomCode,
        sessionId: socket.anonUser.sessionId,
        isOnline: false,
      });

      if (participant) {
        emitToSocket(`anon:${socket.anonUser.roomCode}`, 'room:left', {
          roomCode: socket.anonUser.roomCode,
          sessionId: socket.anonUser.sessionId,
        });
      }
    } catch (error) {
      logger.error(`anon disconnect failed: ${error.message}`);
    }
  });
};

module.exports = registerRoomHandlers;
