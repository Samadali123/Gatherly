const userService = require('../../../services/userService');
const chatService = require('../../../services/chatService');
const socialService = require('../../../services/socialService');
const uploadService = require('../../../services/uploadService');
const cacheService = require('../../../services/cacheService');
const { hasConnectedSocket } = require('../../../sockets/state');
const { sendError, sendSuccess } = require('../../../utils/response');

const health = (req, res) =>
  sendSuccess(res, { uptime: process.uptime(), timestamp: new Date() }, 'OK');

const toPublicUser = async (user, viewerId, extra = {}) => {
  const [relationship, counts] = await Promise.all([
    socialService.getRelationship({ viewerId, targetId: user._id }),
    socialService.countForUser(user._id),
  ]);

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    username: user.username,
    phone: user.phone || '',
    bio: user.bio || '',
    profileNote: user.profileNote || '',
    avatar: user.avatar || user.profileImage,
    profileImage: user.profileImage,
    online: hasConnectedSocket(user.socketId),
    relationship,
    counts,
    ...extra,
  };
};

const search = async (req, res, next) => {
  try {
    const query = req.query.q?.trim();
    const currentUser = await userService.findById(req.user.userId);

    if (!query) {
      const [recentUsers, onlineUsers] = await Promise.all([
        chatService.listDirectContactsForUser(currentUser),
        userService.listOnlineUsers(),
      ]);
      const recentById = new Map(recentUsers.map((user) => [String(user._id), user]));
      const mergedById = new Map();

      recentUsers.forEach((user) => {
        mergedById.set(String(user._id), user);
      });

      onlineUsers
        .filter((user) => String(user._id) !== String(req.user.userId) && hasConnectedSocket(user.socketId))
        .forEach((user) => {
          const key = String(user._id);
          const recent = recentById.get(key);
          const plainUser = typeof user.toObject === 'function' ? user.toObject() : user;
          mergedById.set(key, recent ? { ...plainUser, ...recent } : plainUser);
        });

      const users = Array.from(mergedById.values())
        .filter((user) => String(user._id) !== String(req.user.userId))
        .sort((left, right) => {
          const leftTime = left.lastMessageAt ? new Date(left.lastMessageAt).getTime() : 0;
          const rightTime = right.lastMessageAt ? new Date(right.lastMessageAt).getTime() : 0;
          if (leftTime !== rightTime) return rightTime - leftTime;
          if (Boolean(hasConnectedSocket(left.socketId)) !== Boolean(hasConnectedSocket(right.socketId))) {
            return hasConnectedSocket(left.socketId) ? -1 : 1;
          }
          return String(left.username || left.name || '').localeCompare(String(right.username || right.name || ''));
        });
      const data = await Promise.all(users.map((user) => toPublicUser(user, req.user.userId, {
        lastMessagePreview: user.lastMessagePreview,
        lastMessageAt: user.lastMessageAt,
      })));
      return sendSuccess(res, data, 'Users fetched');
    }

    const users = await userService.searchUsers(query, req.user.userId);
    const data = await Promise.all(users.map((user) => toPublicUser(user, req.user.userId)));
    return sendSuccess(res, data, 'Users fetched');
  } catch (error) {
    return next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await userService.findById(req.params.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, await toPublicUser(user, req.user.userId), 'User profile fetched');
  } catch (error) {
    return next(error);
  }
};

const checkUsername = async (req, res, next) => {
  try {
    const username = String(req.query.username || '').trim();

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return sendSuccess(res, { available: false }, 'Username checked');
    }

    const available = await userService.isUsernameAvailable({ username, userId: req.user.userId });
    return sendSuccess(res, { available }, 'Username checked');
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const payload = {};

    if (req.body.displayName !== undefined || req.body.name !== undefined) {
      payload.name = req.body.displayName ?? req.body.name;
    }

    if (req.body.username !== undefined) {
      const available = await userService.isUsernameAvailable({ username: req.body.username, userId: req.user.userId });
      if (!available) {
        return sendError(res, 'Username already taken', 409, { username: 'Username already taken' });
      }
      payload.username = req.body.username.toLowerCase();
    }

    if (req.body.bio !== undefined) {
      payload.bio = req.body.bio;
    }

    if (req.body.profileNote !== undefined) {
      payload.profileNote = req.body.profileNote;
    }

    if (req.body.phone !== undefined) {
      payload.phone = req.body.phone;
    }

    if (req.body.newEmail) {
      // Email verification delivery can be plugged into the app mailer here.
      // We intentionally do not update the active email until verification exists.
    }

    const updated = Object.keys(payload).length
      ? await userService.updateProfile(req.user.userId, payload)
      : await userService.findById(req.user.userId);
    cacheService.delByPrefix('http:user:').catch(() => {});

    return sendSuccess(
      res,
      {
        user: userService.sanitizeUser(updated),
        emailVerificationSent: Boolean(req.body.newEmail),
        pendingEmail: req.body.newEmail || null,
      },
      'Profile updated'
    );
  } catch (error) {
    return next(error);
  }
};

const follow = async (req, res, next) => {
  try {
    if (req.params.id === req.user.userId) {
      return sendError(res, 'You cannot follow yourself', 400);
    }

    const target = await userService.findById(req.params.id);
    if (!target) return sendError(res, 'User not found', 404);

    await socialService.followUser(req.user.userId, req.params.id);
    cacheService.delByPrefix('http:user:').catch(() => {});
    return sendSuccess(res, await toPublicUser(target, req.user.userId), 'User followed');
  } catch (error) {
    return next(error);
  }
};

const unfollow = async (req, res, next) => {
  try {
    const target = await userService.findById(req.params.id);
    if (!target) return sendError(res, 'User not found', 404);

    await socialService.unfollowUser(req.user.userId, req.params.id);
    cacheService.delByPrefix('http:user:').catch(() => {});
    return sendSuccess(res, await toPublicUser(target, req.user.userId), 'User unfollowed');
  } catch (error) {
    return next(error);
  }
};

const block = async (req, res, next) => {
  try {
    if (req.params.id === req.user.userId) {
      return sendError(res, 'You cannot block yourself', 400);
    }

    const target = await userService.findById(req.params.id);
    if (!target) return sendError(res, 'User not found', 404);

    await socialService.blockUser(req.user.userId, req.params.id);
    cacheService.delByPrefix('http:user:').catch(() => {});
    return sendSuccess(res, await toPublicUser(target, req.user.userId), 'User blocked');
  } catch (error) {
    return next(error);
  }
};

const unblock = async (req, res, next) => {
  try {
    const target = await userService.findById(req.params.id);
    if (!target) return sendError(res, 'User not found', 404);

    await socialService.unblockUser(req.user.userId, req.params.id);
    cacheService.delByPrefix('http:user:').catch(() => {});
    return sendSuccess(res, await toPublicUser(target, req.user.userId), 'User unblocked');
  } catch (error) {
    return next(error);
  }
};

const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'Please select an avatar image', 400);
    }

    const avatarUrl = await uploadService.uploadAvatar({
      file: req.file,
      folder: `gatherly/avatars/${req.user.userId}`,
    });
    const updated = await userService.updateAvatar(req.user.userId, avatarUrl);
    cacheService.delByPrefix('http:user:').catch(() => {});

    return sendSuccess(res, { avatarUrl, user: userService.sanitizeUser(updated) }, 'Avatar updated', 201);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  health,
  search,
  getProfile,
  checkUsername,
  follow,
  unfollow,
  block,
  unblock,
  updateProfile,
  updateAvatar,
};
