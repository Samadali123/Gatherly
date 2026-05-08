const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid');
const anonRoomModel = require('../models/anonRoom.model');
const anonParticipantModel = require('../models/anonParticipant.model');
const anonMessageModel = require('../models/anonMessage.model');
const anonPollModel = require('../models/anonPoll.model');
const userModel = require('../models/user.model');
const { createParticipantIdentity, generateRoomCode, generateSessionId, getRoomExpiryFromInput } = require('../utils/room');
const { buildReplyToPreview } = require('../utils/replyPreview');

const createRoom = async ({ createdBy, name, expiry, expiresAt, password, maxParticipants }) => {
  const passwordHash = password ? await bcrypt.hash(password, 12) : null;
  const room = await anonRoomModel.create({
    code: generateRoomCode(),
    name,
    createdBy,
    expiresAt: getRoomExpiryFromInput(expiresAt, expiry),
    passwordHash,
    maxParticipants,
  });

  return room;
};

const findRoomByCode = (code) => anonRoomModel.findOne({ code });

const getCreatorIdsForRole = async (role) => {
  if (!role) {
    return null;
  }

  const roleQuery = role === 'personal' ? { $in: ['personal', 'user'] } : role;
  const users = await userModel.find({ role: roleQuery }).select('_id');
  return users.map((user) => user._id);
};

const searchActiveRooms = async (query = '', role = null) => {
  const filter = {
    isActive: true,
    expiresAt: { $gt: new Date() },
  };

  const creatorIds = await getCreatorIdsForRole(role);
  if (creatorIds) {
    filter.createdBy = { $in: creatorIds };
  }

  if (query.trim()) {
    filter.$or = [
      { code: { $regex: query.trim(), $options: 'i' } },
      { name: { $regex: query.trim(), $options: 'i' } },
    ];
  }

  const rooms = await anonRoomModel.find(filter).sort({ createdAt: -1 }).limit(25);
  const counts = await anonParticipantModel.aggregate([
    { $match: { roomCode: { $in: rooms.map((room) => room.code) } } },
    { $group: { _id: '$roomCode', count: { $sum: 1 } } },
  ]);
  const countByCode = new Map(counts.map((entry) => [entry._id, entry.count]));

  return rooms.map((room) => ({
    code: room.code,
    name: room.name,
    expiresAt: room.expiresAt,
    maxParticipants: room.maxParticipants,
    participantCount: countByCode.get(room.code) || 0,
    requiresPassword: Boolean(room.passwordHash),
  }));
};

const assertRoomActive = (room) => {
  if (!room || !room.isActive) {
    const error = new Error('Room not found');
    error.statusCode = 404;
    throw error;
  }

  if (room.expiresAt <= new Date()) {
    const error = new Error('Room expired');
    error.statusCode = 410;
    throw error;
  }
};

const listParticipants = (roomCode) => anonParticipantModel.find({ roomCode }).sort({ joinedAt: 1 });

const joinRoom = async ({ room, password }) => {
  assertRoomActive(room);

  if (room.passwordHash) {
    const isValid = password ? await bcrypt.compare(password, room.passwordHash) : false;

    if (!isValid) {
      const error = new Error('Password is not correct for this room');
      error.statusCode = 401;
      throw error;
    }
  }

  const participantCount = await anonParticipantModel.countDocuments({ roomCode: room.code });

  if (participantCount >= room.maxParticipants) {
    const error = new Error('Room is full');
    error.statusCode = 403;
    throw error;
  }

  const identity = createParticipantIdentity();
  const sessionId = generateSessionId();

  const participant = await anonParticipantModel.create({
    roomCode: room.code,
    sessionId,
    ...identity,
    isOnline: true,
  });

  return {
    participant,
    session: {
      sessionId,
      alias: participant.alias,
      avatarColor: participant.avatarColor,
      avatarAnimal: participant.avatarAnimal,
      roomCode: room.code,
    },
  };
};

const findParticipant = ({ roomCode, sessionId }) => anonParticipantModel.findOne({ roomCode, sessionId });

const requireActiveParticipant = async ({ roomCode, sessionId }) => {
  const participant = await findParticipant({ roomCode, sessionId });

  if (!participant) {
    const error = new Error('You are no longer in this room.');
    error.statusCode = 403;
    throw error;
  }

  return participant;
};

const setParticipantOnlineStatus = ({ roomCode, sessionId, isOnline }) =>
  anonParticipantModel.findOneAndUpdate({ roomCode, sessionId }, { isOnline }, { new: true });

const removeParticipant = ({ roomCode, sessionId }) =>
  anonParticipantModel.findOneAndDelete({ roomCode, sessionId });

const serializeAnonMessage = (message, sessionId = null) => {
  const plain = typeof message.toObject === 'function' ? message.toObject() : message;
  const reactionMap = new Map();

  (plain.reactions || []).forEach((reaction) => {
    const current = reactionMap.get(reaction.emoji) || { emoji: reaction.emoji, count: 0, reacted: false };
    reactionMap.set(reaction.emoji, {
      ...current,
      count: current.count + 1,
      reacted: current.reacted || reaction.sessionId === sessionId,
    });
  });

  return {
    ...plain,
    reactions: Array.from(reactionMap.values()),
  };
};

const createAnonMessage = async ({ room, participant, content, parentMessageId = null, attachments = [] }) => {
  let replyTo = null;

  if (parentMessageId) {
    const parent = await findAnonMessage({ roomCode: room.code, messageId: parentMessageId });

    if (!parent) {
      const error = new Error('You cannot reply to this message');
      error.statusCode = 403;
      throw error;
    }

    if (parent.sessionId !== participant.sessionId) {
      const error = new Error('You cannot reply to this message');
      error.statusCode = 403;
      throw error;
    }

    replyTo = buildReplyToPreview({
      message: parent,
      senderId: parent.sessionId,
      senderName: parent.alias,
    });
  }

  return anonMessageModel.create({
    roomCode: room.code,
    sessionId: participant.sessionId,
    alias: participant.alias,
    avatarColor: participant.avatarColor,
    content,
    parentMessageId,
    replyTo,
    attachments,
    expiresAt: room.expiresAt,
  });
};

const listAnonMessages = async (roomCode, sessionId = null) => {
  const messages = await anonMessageModel.find({ roomCode }).sort({ createdAt: 1 });
  return messages.map((message) => serializeAnonMessage(message, sessionId));
};

const findAnonMessage = ({ roomCode, messageId }) => anonMessageModel.findOne({ _id: messageId, roomCode });

const pinAnonMessage = async ({ roomCode, messageId, sessionId }) => {
  const message = await findAnonMessage({ roomCode, messageId });

  if (!message) {
    return null;
  }

  if (message.sessionId !== sessionId) {
    const error = new Error('You do not have permission to perform this action');
    error.statusCode = 403;
    throw error;
  }

  message.isPinned = true;
  message.pinnedBySessionId = sessionId;
  await message.save();
  return serializeAnonMessage(message, sessionId);
};

const unpinAnonMessage = async ({ roomCode, messageId, sessionId }) => {
  const message = await findAnonMessage({ roomCode, messageId });

  if (!message) {
    return null;
  }

  if (message.pinnedBySessionId && message.pinnedBySessionId !== sessionId) {
    const error = new Error('You do not have permission to perform this action');
    error.statusCode = 403;
    throw error;
  }

  message.isPinned = false;
  message.pinnedBySessionId = null;
  await message.save();
  return serializeAnonMessage(message, sessionId);
};

const reactToAnonMessage = async ({ roomCode, messageId, sessionId, emoji }) => {
  const message = await findAnonMessage({ roomCode, messageId });

  if (!message) {
    return null;
  }

  if (message.sessionId === sessionId) {
    const error = new Error('You cannot react to your own message');
    error.statusCode = 403;
    throw error;
  }

  message.reactions = (message.reactions || []).filter((reaction) => reaction.sessionId !== sessionId);
  message.reactions.push({ sessionId, emoji });
  await message.save();
  return serializeAnonMessage(message, sessionId);
};

const serializeAnonPoll = (poll) => ({
  id: poll._id,
  roomCode: poll.roomCode,
  question: poll.question,
  expiresAt: poll.expiresAt,
  isActive: poll.isActive,
  options: poll.options.map((option) => ({
    id: option.id,
    text: option.text,
    voteCount: option.votes.length,
  })),
});

const createAnonPoll = async ({ room, participant, question, options }) => {
  assertRoomActive(room);

  const poll = await anonPollModel.create({
    roomCode: room.code,
    question,
    options: options.map((text) => ({ id: nanoid(10), text, votes: [] })),
    createdBySessionId: participant.sessionId,
    expiresAt: room.expiresAt,
  });

  return serializeAnonPoll(poll);
};

const voteAnonPoll = async ({ roomCode, pollId, optionId, sessionId }) => {
  const poll = await anonPollModel.findOne({ _id: pollId, roomCode });

  if (!poll) {
    return null;
  }

  poll.options.forEach((option) => {
    option.votes = option.votes.filter((voteSessionId) => voteSessionId !== sessionId);
  });

  const selected = poll.options.find((option) => option.id === optionId);

  if (!selected) {
    const error = new Error('Invalid poll option');
    error.statusCode = 400;
    throw error;
  }

  selected.votes.push(sessionId);
  await poll.save();
  return serializeAnonPoll(poll);
};

const listAnonPolls = async (roomCode) => {
  const polls = await anonPollModel.find({ roomCode }).sort({ createdAt: 1 });
  return polls.map(serializeAnonPoll);
};

const getAnonSession = ({ sessionId, alias, avatarColor, avatarAnimal, roomCode }) => ({
  sessionId,
  alias,
  avatarColor,
  avatarAnimal,
  roomCode,
});

const listExpiredRooms = (now) => anonRoomModel.find({ isActive: true, expiresAt: { $lte: now } });

const deactivateRooms = (roomIds) => anonRoomModel.updateMany({ _id: { $in: roomIds } }, { isActive: false });

module.exports = {
  createRoom,
  searchActiveRooms,
  findRoomByCode,
  assertRoomActive,
  listParticipants,
  joinRoom,
  findParticipant,
  requireActiveParticipant,
  setParticipantOnlineStatus,
  removeParticipant,
  createAnonMessage,
  listAnonMessages,
  serializeAnonMessage,
  pinAnonMessage,
  unpinAnonMessage,
  reactToAnonMessage,
  createAnonPoll,
  voteAnonPoll,
  listAnonPolls,
  getAnonSession,
  listExpiredRooms,
  deactivateRooms,
};
