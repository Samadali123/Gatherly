const userModel = require('../models/user.model');
const { isUserInDnd } = require('../utils/dnd');
const { normalizePhone } = require('../utils/phone');

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  username: user.username,
  number: user.number,
  phone: user.phone || '',
  bio: user.bio || '',
  profileNote: user.profileNote || '',
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

const findByEmail = (email) => (email ? userModel.findOne({ email: email.toLowerCase() }) : null);

const findByUsername = (username) => (username ? userModel.findOne({ username: username.toLowerCase() }) : null);

const findByPhone = (phone) => userModel.findOne({ phone: normalizePhone(phone) });

const findByGoogleId = (googleId) => userModel.findOne({ googleId });

const findByIdentifier = async (identifier) => {
  const value = String(identifier || '').trim();
  if (!value) return null;
  if (value.includes('@')) return findByEmail(value);
  const normalizedPhone = normalizePhone(value);
  if (normalizedPhone) {
    const byPhone = await findByPhone(normalizedPhone);
    if (byPhone) return byPhone;
  }
  return findByUsername(value.toLowerCase());
};

const isUsernameAvailable = async ({ username, userId }) => {
  const existing = await userModel.findOne({ username: username.toLowerCase(), _id: { $ne: userId } });
  return !existing;
};

const listOnlineUsers = () =>
  userModel.find({
    socketId: {
      $ne: '',
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
    .select('name email username phone avatar profileImage socketId profileNote bio')
    .sort({ name: 1 });

const updateSocketId = (userId, socketId) =>
  userModel.findByIdAndUpdate(userId, { socketId }, { new: true });

const clearSocketById = (socketId) =>
  userModel.findOneAndUpdate({ socketId }, { socketId: '' }, { new: true });

const clearAllSocketIds = async () => {
  try {
    const onlineUsers = await listOnlineUsers();
    await Promise.allSettled(onlineUsers.map((user) => updateSocketId(user._id, '')));
  } catch {
    // Presence cleanup is best-effort; a stale socket id should not block app startup.
  }
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
  userModel.findByIdAndUpdate(
    userId,
    {
      ...payload,
      ...(payload.phone !== undefined ? { phone: normalizePhone(payload.phone) || null } : {}),
    },
    { new: true, runValidators: true }
  );

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
        { phone: { $regex: normalizePhone(query) || query, $options: 'i' } },
      ],
    })
    .limit(10);

module.exports = {
  sanitizeUser,
  normalizeRole,
  findById,
  findByEmail,
  findByGoogleId,
  findByIdentifier,
  findByUsername,
  findByPhone,
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
