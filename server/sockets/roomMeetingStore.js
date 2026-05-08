const meetingByRoom = new Map();
const disconnectTimers = new Map();

const getMeeting = (roomCode) => meetingByRoom.get(roomCode) || null;

const getParticipantKey = (roomCode, sessionId) => `${roomCode}:${sessionId}`;

const clearParticipantDisconnectTimer = (roomCode, sessionId) => {
  const key = getParticipantKey(roomCode, sessionId);
  const timer = disconnectTimers.get(key);

  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(key);
    return true;
  }

  return false;
};

const setMeeting = (roomCode, meeting) => {
  clearParticipantDisconnectTimer(roomCode, meeting.hostSessionId);
  meetingByRoom.set(roomCode, meeting);
  return meeting;
};

const endMeeting = (roomCode, hostSessionId = null) => {
  const meeting = getMeeting(roomCode);

  if (!meeting || (hostSessionId && meeting.hostSessionId !== hostSessionId)) {
    return null;
  }

  Array.from(disconnectTimers.keys()).forEach((key) => {
    if (key.startsWith(`${roomCode}:`)) {
      clearTimeout(disconnectTimers.get(key));
      disconnectTimers.delete(key);
    }
  });
  meetingByRoom.delete(roomCode);
  return meeting;
};

const addMeetingParticipant = ({ roomCode, sessionId, displayName, socketId }) => {
  const meeting = getMeeting(roomCode);

  if (!meeting) {
    return null;
  }

  clearParticipantDisconnectTimer(roomCode, sessionId);

  if (!meeting.activeParticipants) {
    meeting.activeParticipants = new Map();
  }

  if (sessionId === meeting.hostSessionId) {
    meeting.hostSocketId = socketId;
  }

  meeting.activeParticipants.set(sessionId, {
    displayName,
    sessionId,
    socketId,
  });

  return meeting;
};

const removeMeetingParticipant = (roomCode, sessionId) => {
  const meeting = getMeeting(roomCode);

  if (!meeting?.activeParticipants?.has(sessionId)) {
    return null;
  }

  const participant = meeting.activeParticipants.get(sessionId);
  meeting.activeParticipants.delete(sessionId);
  clearParticipantDisconnectTimer(roomCode, sessionId);
  return { meeting, participant };
};

const scheduleParticipantDisconnect = ({ roomCode, sessionId, onDeparted, timeoutMs = 10000 }) => {
  const meeting = getMeeting(roomCode);

  if (!meeting || meeting.hostSessionId === sessionId || !meeting.activeParticipants?.has(sessionId)) {
    return false;
  }

  const key = getParticipantKey(roomCode, sessionId);

  if (disconnectTimers.has(key)) {
    return true;
  }

  const timer = setTimeout(() => {
    disconnectTimers.delete(key);
    const departed = removeMeetingParticipant(roomCode, sessionId);

    if (departed) {
      onDeparted(departed);
    }
  }, timeoutMs);

  disconnectTimers.set(key, timer);
  return true;
};

const publicMeeting = (meeting) =>
  meeting
    ? {
        active: true,
        roomCode: meeting.roomCode,
        hostSessionId: meeting.hostSessionId,
        hostAlias: meeting.hostAlias,
        startedAt: meeting.startedAt,
        pending: Array.from(meeting.pending.values()),
        approved: Array.from(meeting.approved),
        activeParticipants: meeting.activeParticipants ? Array.from(meeting.activeParticipants.values()) : [],
      }
    : { active: false, pending: [], approved: [] };

module.exports = {
  addMeetingParticipant,
  clearParticipantDisconnectTimer,
  endMeeting,
  getMeeting,
  publicMeeting,
  removeMeetingParticipant,
  scheduleParticipantDisconnect,
  setMeeting,
};
