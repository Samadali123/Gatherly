const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const passwordResetTokenModel = require('../models/passwordResetToken.model');
const config = require('../configs');
const emailService = require('./emailService');
const generateTokens = require('../utils/generateTokens');
const { hashToken } = require('../utils/token');
const { isUserInDnd } = require('../utils/dnd');

const BCRYPT_ROUNDS = 12;
const PASSWORD_RESET_TTL_MS = 5 * 60 * 1000;

const toAuthUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  username: user.username,
  bio: user.bio || '',
  phone: user.phone || '',
  number: user.number,
  avatar: user.avatar || user.profileImage,
  profileImage: user.profileImage,
  role: user.role === 'user' ? 'personal' : user.role,
  dndEnabled: user.dndEnabled,
  dndActive: isUserInDnd(user),
  dndPeriod: user.dndPeriod,
  dndWhitelist: user.dndWhitelist,
  lastLoginAt: user.lastLoginAt,
});

const buildUsername = (email) => email.toLowerCase();

const getUserType = (user) => (user.role === 'professional' ? 'professional' : 'personal');

const buildResetUrl = (token) => {
  const baseUrl = config.APP_DOMAIN.replace(/\/$/, '');
  return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const buildResetEmail = ({ name, resetUrl }) => {
  const safeName = escapeHtml(name);
  const safeResetUrl = escapeHtml(resetUrl);
  const text = [
    `Hi ${name},`,
    '',
    'We received a request to reset your Gatherly password.',
    `Reset Password: ${resetUrl}`,
    '',
    'This link expires in 5 minutes.',
    "If you didn't request this, you can ignore this email.",
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; color: #143f35; line-height: 1.6;">
      <p>Hi ${safeName},</p>
      <p>We received a request to reset your Gatherly password.</p>
      <p>
        <a href="${safeResetUrl}" style="display: inline-block; background: #245143; color: #ffffff; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Reset Password
        </a>
      </p>
      <p>This link expires in 5 minutes.</p>
      <p>If you didn't request this, you can ignore this email.</p>
    </div>
  `;

  return { text, html };
};

const register = async ({ name, email, password, role = 'personal' }) => {
  const existingUser = await userModel.findOne({ email });

  if (existingUser) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await userModel.create({
    name,
    email,
    username: buildUsername(email),
    password: passwordHash,
    role,
    passwordChangedAt: new Date(),
  });

  const { accessToken, refreshToken } = generateTokens(user);
  user.refreshTokenHash = hashToken(refreshToken);
  user.lastLoginAt = new Date();
  await user.save();

  return {
    accessToken,
    refreshToken,
    user,
  };
};

const login = async ({ email, password, role = 'personal' }) => {
  const user = await userModel.findOne({ email });

  if (!user) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const storedRole = user.role === 'user' ? 'personal' : user.role;
  if (storedRole !== role) {
    const error = new Error(`This account is registered for ${storedRole} use`);
    error.statusCode = 403;
    throw error;
  }

  const { accessToken, refreshToken } = generateTokens(user);
  user.refreshTokenHash = hashToken(refreshToken);
  user.lastLoginAt = new Date();
  await user.save();

  return {
    accessToken,
    refreshToken,
    user,
  };
};

const refresh = async (refreshToken) => {
  let decoded;

  try {
    decoded = jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET);
  } catch (error) {
    const authError = new Error('Invalid refresh token');
    authError.statusCode = 401;
    throw authError;
  }

  const user = await userModel.findById(decoded.userId);

  if (!user) {
    const error = new Error('Refresh token revoked');
    error.statusCode = 401;
    throw error;
  }

  if (!user.refreshTokenHash || user.refreshTokenHash !== hashToken(refreshToken)) {
    const error = new Error('Refresh token revoked');
    error.statusCode = 401;
    throw error;
  }

  if (user.tokenVersion !== decoded.tokenVersion) {
    const error = new Error('Session expired, please login again');
    error.statusCode = 401;
    throw error;
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
  user.refreshTokenHash = hashToken(newRefreshToken);
  await user.save();

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user,
  };
};

const requestPasswordReset = async ({ email }) => {
  const user = await userModel.findOne({ email: email.toLowerCase() });

  if (!user) {
    const error = new Error('No account found');
    error.statusCode = 404;
    throw error;
  }

  await passwordResetTokenModel.deleteMany({ userId: user._id });

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await passwordResetTokenModel.create({
    tokenHash,
    userId: user._id,
    userType: getUserType(user),
    expiresAt,
  });

  const resetUrl = buildResetUrl(token);
  const { text, html } = buildResetEmail({
    name: user.name || user.username || 'there',
    resetUrl,
  });

  await emailService.sendMail({
    to: user.email,
    subject: 'Reset your Gatherly password',
    text,
    html,
  });

  return true;
};

const findValidResetToken = async (token) => {
  const tokenHash = hashToken(token);
  const resetToken = await passwordResetTokenModel.findOne({ tokenHash });

  if (!resetToken) {
    return null;
  }

  if (resetToken.expiresAt.getTime() < Date.now()) {
    await passwordResetTokenModel.deleteOne({ _id: resetToken._id });
    return null;
  }

  return resetToken;
};

const validatePasswordResetToken = async (token) => {
  const resetToken = await findValidResetToken(token);

  if (!resetToken) {
    const error = new Error('Invalid or expired token');
    error.statusCode = 400;
    throw error;
  }

  return true;
};

const resetPassword = async ({ token, newPassword }) => {
  const resetToken = await findValidResetToken(token);

  if (!resetToken) {
    const error = new Error('Invalid token');
    error.statusCode = 400;
    throw error;
  }

  const user = await userModel.findById(resetToken.userId);

  if (!user) {
    await passwordResetTokenModel.deleteOne({ _id: resetToken._id });
    const error = new Error('Invalid token');
    error.statusCode = 400;
    throw error;
  }

  user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  user.passwordChangedAt = new Date();
  user.refreshTokenHash = null;
  user.tokenVersion += 1;
  await user.save();

  await passwordResetTokenModel.deleteOne({ _id: resetToken._id });

  return true;
};

const resolveUserFromAccessToken = async (token, { ignoreExpiration = false } = {}) => {
  try {
    const decoded = ignoreExpiration
      ? jwt.verify(token, config.ACCESS_TOKEN_SECRET, { ignoreExpiration: true })
      : jwt.verify(token, config.ACCESS_TOKEN_SECRET);

    return userModel.findById(decoded.userId);
  } catch (error) {
    return null;
  }
};

const resolveUserFromRefreshToken = async (refreshToken) => {
  if (!refreshToken) {
    return null;
  }

  try {
    const decoded = jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET);
    const user = await userModel.findById(decoded.userId);

    if (!user) {
      return null;
    }

    if (!user.refreshTokenHash || user.refreshTokenHash !== hashToken(refreshToken)) {
      return null;
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
};

const logout = async ({ accessToken, refreshToken } = {}) => {
  let user = accessToken ? await resolveUserFromAccessToken(accessToken, { ignoreExpiration: true }) : null;

  if (!user) {
    user = await resolveUserFromRefreshToken(refreshToken);
  }

  if (!user) {
    return null;
  }

  user.refreshTokenHash = null;
  user.tokenVersion += 1;
  await user.save();

  return user;
};

module.exports = {
  toAuthUser,
  register,
  login,
  refresh,
  requestPasswordReset,
  validatePasswordResetToken,
  resetPassword,
  logout,
  resolveUserFromAccessToken,
  resolveUserFromRefreshToken,
};
