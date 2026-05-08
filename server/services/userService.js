const userModel = require('../models/user.model');
const { isUserInDnd } = require('../utils/dnd');

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  username: user.username,
  number: user.number,
  phone: user.phone || '',
  bio: user.bio || '',
  avatar: user.avatar || user.profileImage,
  profileImage: user.profileImage,
  socketId: user.socketId,
  role: user.role,
  dndEnabled: user.dndEnabled,
  dndActive: isUserInDnd(user),
  dndPeriod: user.dndPeriod,
  dndWhitelist: user.dndWhitelist,
  lastLoginAt: user.lastLoginAt,
});

const findById = (userId) => userModel.findById(userId);

const findByEmail = (email) => userModel.findOne({ email: email.toLowerCase() });

const findByUsername = (username) => userModel.findOne({ username: username.toLowerCase() });

const isUsernameAvailable = async ({ username, userId }) => {
  const existing = await userModel.findOne({ username: username.toLowerCase(), _id: { $ne: userId } });
  return !existing;
};

const listOnlineUsers = () =>
  userModel.find({
    socketId: {
      $nin: [''],
    },
  });

const normalizeRole = (role) => (role === 'user' ? 'personal' : role);
const roleFilter = (role) => {
  const normalized = normalizeRole(role);
  return normalized === 'personal' ? { $in: ['personal', 'user'] } : normalized;
};

const listChatUsers = (excludeUserId, role = null) =>
  userModel
    .find({
      _id: { $ne: excludeUserId },
      ...(role ? { role: roleFilter(role) } : {}),
    })
    .select('name email username avatar profileImage socketId')
    .sort({ name: 1 });

const updateSocketId = (userId, socketId) =>
  userModel.findByIdAndUpdate(userId, { socketId }, { new: true });

const clearSocketById = (socketId) =>
  userModel.findOneAndUpdate({ socketId }, { socketId: '' }, { new: true });

const clearAllSocketIds = async () => {
  await userModel.updateMany({}, { $set: { socketId: '' } });
};

const updateDndSettings = (userId, payload) =>
  userModel.findByIdAndUpdate(
    userId,
    {
      dndEnabled: payload.dndEnabled,
      dndPeriod: payload.dndPeriod,
      dndWhitelist: payload.dndWhitelist,
    },
    { new: true }
  );

const updateProfile = (userId, payload) =>
  userModel.findByIdAndUpdate(userId, payload, { new: true, runValidators: true });

const updateAvatar = (userId, avatarUrl) =>
  userModel.findByIdAndUpdate(
    userId,
    {
      avatar: avatarUrl,
      profileImage: avatarUrl,
    },
    { new: true }
  );

const searchUsers = async (query, excludeUserId, role = null) =>
  userModel
    .find({
      _id: { $ne: excludeUserId },
      ...(role ? { role: roleFilter(role) } : {}),
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
      ],
    })
    .limit(10);

module.exports = {
  sanitizeUser,
  normalizeRole,
  findById,
  findByEmail,
  findByUsername,
  isUsernameAvailable,
  listOnlineUsers,
  listChatUsers,
  updateSocketId,
  clearSocketById,
  clearAllSocketIds,
  updateDndSettings,
  updateProfile,
  updateAvatar,
  searchUsers,
};
