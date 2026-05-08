const userService = require('../../../services/userService');
const uploadService = require('../../../services/uploadService');
const cacheService = require('../../../services/cacheService');
const { hasConnectedSocket } = require('../../../sockets/state');
const { sendError, sendSuccess } = require('../../../utils/response');

const health = (req, res) =>
  sendSuccess(res, { uptime: process.uptime(), timestamp: new Date() }, 'OK');

const updateDnd = async (req, res, next) => {
  try {
    const whitelistUsers = await Promise.all(req.body.dndWhitelist.map((id) => userService.findById(id)));
    const missing = whitelistUsers.some((user) => !user);

    if (missing) {
      return sendError(res, 'User not found', 404);
    }

    const updated = await userService.updateDndSettings(req.user.userId, req.body);

    return sendSuccess(res, userService.sanitizeUser(updated), 'DND settings updated');
  } catch (error) {
    return next(error);
  }
};

const search = async (req, res, next) => {
  try {
    const query = req.query.q?.trim();
    const currentUser = await userService.findById(req.user.userId);
    const currentRole = userService.normalizeRole(currentUser?.role);

    if (!query) {
      const users = await userService.listChatUsers(req.user.userId, currentRole);
      return sendSuccess(
        res,
        users.map((user) => ({
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          avatar: user.avatar || user.profileImage,
          profileImage: user.profileImage,
          online: hasConnectedSocket(user.socketId),
        })),
        'Users fetched'
      );
    }

    const users = await userService.searchUsers(query, req.user.userId, currentRole);
    return sendSuccess(
      res,
      users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar || user.profileImage,
        profileImage: user.profileImage,
        online: hasConnectedSocket(user.socketId),
      })),
      'Users fetched'
    );
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
  updateDnd,
  search,
  checkUsername,
  updateProfile,
  updateAvatar,
};
