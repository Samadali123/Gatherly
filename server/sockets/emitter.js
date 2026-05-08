const userService = require('../services/userService');
const groupService = require('../services/groupService');
const { isUserInDnd } = require('../utils/dnd');
const { getIO } = require('./state');

const emitToSocket = (roomOrSocketId, event, payload) => {
  const io = getIO();

  if (!io) {
    return;
  }

  io.to(roomOrSocketId).emit(event, payload);
};

const emitToUser = async (userId, event, payload, senderId = null) => {
  const io = getIO();

  if (!io) {
    return false;
  }

  const user = await userService.findById(userId);

  if (!user || !user.socketId) {
    return false;
  }

  const mutedUsers = (user.dndWhitelist || []).map((entry) => entry.toString());
  const senderMuted = mutedUsers.length > 0 && senderId && mutedUsers.includes(senderId.toString());

  if (isUserInDnd(user) && senderMuted) {
    return false;
  }

  io.to(user.socketId).emit(event, payload);
  return true;
};

const emitToChatMembers = async (chatId, event, payload, senderId = null) => {
  if (!chatId) {
    return;
  }

  if (chatId.startsWith('dm:')) {
    const usernames = chatId.split(':').slice(1);
    const users = await Promise.all(usernames.map((username) => userService.findByUsername(username)));
    await Promise.all(
      users
        .filter(Boolean)
        .filter((user) => !senderId || user._id.toString() !== senderId.toString())
        .map((user) => emitToUser(user._id, event, payload, senderId))
    );
    return;
  }

  const group = await groupService.findById(chatId);

  if (!group) {
    return;
  }

  const populatedGroup = await group.populate('users');
  await Promise.all(
    populatedGroup.users
      .filter((user) => !senderId || user._id.toString() !== senderId.toString())
      .map((user) => emitToUser(user._id, event, payload, senderId))
  );
};

module.exports = {
  emitToSocket,
  emitToUser,
  emitToChatMembers,
};
