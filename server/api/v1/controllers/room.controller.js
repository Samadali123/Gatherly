const roomService = require('../../../services/roomService');
const uploadService = require('../../../services/uploadService');
const meetingService = require('../../../services/meetingService');
const userService = require('../../../services/userService');
const cacheService = require('../../../services/cacheService');
const config = require('../../../configs');
const { emitToSocket } = require('../../../sockets/emitter');
const { endMeeting, getMeeting, publicMeeting } = require('../../../sockets/roomMeetingStore');
const { sendError, sendSuccess } = require('../../../utils/response');
const { REFRESH_COOKIE_OPTIONS } = require('../../../utils/cookies');

const createRoom = async (req, res, next) => {
  try {
    const room = await roomService.createRoom({
      createdBy: req.user.userId,
      name: req.body.name,
      expiry: req.body.expiry,
      expiresAt: req.body.expiresAt,
      password: req.body.password,
      maxParticipants: req.body.maxParticipants,
    });
    const { participant, session } = await roomService.joinRoom({
      room,
      password: req.body.password,
    });

    res.cookie('anonSession', session, {
      httpOnly: true,
      sameSite: 'strict',
      secure: config.COOKIE_SECURE,
      signed: true,
      maxAge: REFRESH_COOKIE_OPTIONS.maxAge,
    });
    cacheService.delByPrefix('http:user:').catch(() => {});

    return sendSuccess(
      res,
      {
        code: room.code,
        name: room.name,
        shareUrl: `/room/${room.code}`,
        expiresAt: room.expiresAt,
        alias: participant.alias,
      },
      'Room created',
      201
    );
  } catch (error) {
    return next(error);
  }
};

const searchRooms = async (req, res, next) => {
  try {
    const user = await userService.findById(req.user.userId);
    const role = user?.role === 'user' ? 'personal' : user?.role;
    const rooms = await roomService.searchActiveRooms(req.query.q || '', role);
    return sendSuccess(res, rooms, 'Rooms fetched');
  } catch (error) {
    return next(error);
  }
};

const getRoom = async (req, res, next) => {
  try {
    const room = await roomService.findRoomByCode(req.params.code);
    roomService.assertRoomActive(room);

    return sendSuccess(
      res,
      {
        code: room.code,
        name: room.name,
        createdBy: room.createdBy,
        expiresAt: room.expiresAt,
        maxParticipants: room.maxParticipants,
        isActive: room.isActive,
        requiresPassword: !!room.passwordHash,
      },
      'Room fetched'
    );
  } catch (error) {
    return next(error);
  }
};

const joinRoom = async (req, res, next) => {
  try {
    const room = await roomService.findRoomByCode(req.params.code);
    const { participant, session } = await roomService.joinRoom({
      room,
      password: req.body.password,
    });

    res.cookie('anonSession', session, {
      httpOnly: true,
      sameSite: 'strict',
      secure: config.COOKIE_SECURE,
      signed: true,
      maxAge: REFRESH_COOKIE_OPTIONS.maxAge,
    });
    cacheService.delByPrefix('http:user:').catch(() => {});

    emitToSocket(`anon:${room.code}`, 'room:joined', {
      roomCode: room.code,
      sessionId: participant.sessionId,
      alias: participant.alias,
    });

    return sendSuccess(
      res,
      {
        alias: participant.alias,
        avatarColor: participant.avatarColor,
        avatarAnimal: participant.avatarAnimal,
      },
      'Joined room'
    );
  } catch (error) {
    return next(error);
  }
};

const listParticipants = async (req, res, next) => {
  try {
    if (req.anonUser.roomCode !== req.params.code) {
      return sendError(res, 'You do not have permission to perform this action', 403);
    }

    await roomService.requireActiveParticipant({ roomCode: req.params.code, sessionId: req.anonUser.sessionId });
    const participants = await roomService.listParticipants(req.params.code);
    return sendSuccess(res, participants, 'Participants fetched');
  } catch (error) {
    return next(error);
  }
};

const getSession = async (req, res, next) => {
  try {
    if (req.anonUser.roomCode !== req.params.code) {
      return sendError(res, 'You do not have permission to perform this action', 403);
    }

    await roomService.requireActiveParticipant({ roomCode: req.params.code, sessionId: req.anonUser.sessionId });
    return sendSuccess(res, roomService.getAnonSession(req.anonUser), 'Anonymous session fetched');
  } catch (error) {
    return next(error);
  }
};

const listMessages = async (req, res, next) => {
  try {
    if (req.anonUser.roomCode !== req.params.code) {
      return sendError(res, 'You do not have permission to perform this action', 403);
    }

    await roomService.requireActiveParticipant({ roomCode: req.params.code, sessionId: req.anonUser.sessionId });
    const messages = await roomService.listAnonMessages(req.params.code, req.anonUser.sessionId);
    return sendSuccess(res, messages, 'Anonymous room messages fetched');
  } catch (error) {
    return next(error);
  }
};

const listPolls = async (req, res, next) => {
  try {
    if (req.anonUser.roomCode !== req.params.code) {
      return sendError(res, 'You do not have permission to perform this action', 403);
    }

    await roomService.requireActiveParticipant({ roomCode: req.params.code, sessionId: req.anonUser.sessionId });
    const polls = await roomService.listAnonPolls(req.params.code);
    return sendSuccess(res, polls, 'Anonymous room polls fetched');
  } catch (error) {
    return next(error);
  }
};

const uploadAttachments = async (req, res, next) => {
  try {
    if (req.anonUser.roomCode !== req.params.code) {
      return sendError(res, 'You do not have permission to perform this action', 403);
    }

    await roomService.requireActiveParticipant({ roomCode: req.params.code, sessionId: req.anonUser.sessionId });
    const attachments = await uploadService.uploadAttachments({
      files: req.files || [],
      type: req.body.type,
      folder: `gatherly/rooms/${req.params.code}`,
    });

    return sendSuccess(res, attachments, 'Attachments uploaded', 201);
  } catch (error) {
    return next(error);
  }
};

const removeParticipant = async (req, res, next) => {
  try {
    const room = await roomService.findRoomByCode(req.params.code);

    if (!room) {
      return sendError(res, 'Room not found', 404);
    }

    if (!room.createdBy || room.createdBy.toString() !== req.user.userId) {
      return sendError(res, 'You do not have permission to perform this action', 403);
    }

    const removed = await roomService.removeParticipant({
      roomCode: req.params.code,
      sessionId: req.params.sessionId,
    });

    if (!removed) {
      return sendError(res, 'Resource not found', 404);
    }

    emitToSocket(`anon:${req.params.code}`, 'room:participant:kicked', {
      sessionId: req.params.sessionId,
      message: 'You are no longer in this room.',
    });
    cacheService.delByPrefix('http:user:').catch(() => {});

    return sendSuccess(res, null, 'Participant removed');
  } catch (error) {
    return next(error);
  }
};

const deleteRoom = async (req, res, next) => {
  try {
    const room = await roomService.findRoomByCode(req.params.code);

    if (!room) {
      return sendError(res, 'Room not found', 404);
    }

    if (!room.createdBy || String(room.createdBy) !== String(req.user.userId)) {
      return sendError(res, 'You do not have permission to perform this action', 403);
    }

    endMeeting(req.params.code);
    await roomService.deleteRoom(req.params.code);
    emitToSocket(`anon:${req.params.code}`, 'room:deleted', {
      roomCode: req.params.code,
      message: 'This room was deleted by the host.',
    });
    cacheService.delByPrefix('http:user:').catch(() => {});

    return sendSuccess(res, null, 'Room deleted');
  } catch (error) {
    return next(error);
  }
};

const createMeetingToken = async (req, res, next) => {
  try {
    const room = await roomService.findRoomByCode(req.params.code);
    roomService.assertRoomActive(room);

    if (req.anonUser.roomCode !== req.params.code) {
      return sendError(res, 'Join this room before starting the meeting', 403);
    }

    const user = await userService.findById(req.user.userId);
    const role = user?.role === 'user' ? 'personal' : user?.role;

    const meeting = getMeeting(room.code);
    const isRoomCreator = room.createdBy && String(room.createdBy) === String(req.user.userId);
    const isMeetingHost = meeting?.hostSessionId === req.anonUser.sessionId;
    const isApprovedParticipant = meeting?.approved?.has(req.anonUser.sessionId);

    if (role !== 'professional') {
      return sendError(res, 'Professional workspace is required for room meetings', 403);
    }

    if (meeting && !isRoomCreator && !isMeetingHost && !isApprovedParticipant) {
      return sendError(res, 'The host has not admitted you to this meeting yet', 403);
    }

    if (!meeting && !isRoomCreator) {
      return sendError(res, 'Only the room host can start this meeting', 403);
    }

    const livekitRoom = meetingService.getLiveKitRoomName(room.code);
    const token = meetingService.createMeetingToken({
      roomName: livekitRoom,
      identity: user._id.toString(),
      name: user.name || user.username,
      role,
    });

    return sendSuccess(res, {
      token,
      url: config.LIVEKIT_URL,
      room: livekitRoom,
    }, 'Meeting token created');
  } catch (error) {
    return next(error);
  }
};

const endRoomMeeting = async (req, res, next) => {
  try {
    if (req.anonUser.roomCode !== req.params.code) {
      return sendError(res, 'You do not have permission to perform this action', 403);
    }

    const room = await roomService.findRoomByCode(req.params.code);
    const isRoomCreator = room?.createdBy && String(room.createdBy) === String(req.user.userId);
    const meeting = endMeeting(req.params.code, isRoomCreator ? null : req.anonUser.sessionId);

    if (!meeting) {
      return sendError(res, 'Meeting not found', 404);
    }

    emitToSocket(`anon:${req.params.code}`, 'room:meeting:ended');
    emitToSocket(`anon:${req.params.code}`, 'meeting_ended', { meetingId: req.params.code });
    emitToSocket(`anon:${req.params.code}`, 'room:meeting:state', publicMeeting(null));

    return sendSuccess(res, null, 'Meeting ended');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createRoom,
  searchRooms,
  getRoom,
  joinRoom,
  listParticipants,
  getSession,
  listMessages,
  listPolls,
  uploadAttachments,
  removeParticipant,
  deleteRoom,
  createMeetingToken,
  endRoomMeeting,
};
