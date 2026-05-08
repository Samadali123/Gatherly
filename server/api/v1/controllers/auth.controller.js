const authService = require('../../../services/authService');
const userService = require('../../../services/userService');
const { sendError, sendSuccess } = require('../../../utils/response');

const register = async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await authService.register(req.body);

    return sendSuccess(
      res,
      {
        accessToken,
        refreshToken,
        user: authService.toAuthUser(user),
      },
      'Registration successful',
      201
    );
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await authService.login(req.body);

    return sendSuccess(
      res,
      {
        accessToken,
        refreshToken,
        user: authService.toAuthUser(user),
      },
      'Login successful'
    );
  } catch (error) {
    return next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};

    if (!refreshToken) {
      return sendError(res, 'Refresh token missing', 401);
    }

    const { accessToken, refreshToken: newRefreshToken, user } = await authService.refresh(refreshToken);

    return sendSuccess(res, { accessToken, refreshToken: newRefreshToken, user: authService.toAuthUser(user) }, 'Token refreshed');
  } catch (error) {
    return next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    await authService.requestPasswordReset(req.body);
    return sendSuccess(res, null, 'Reset email sent');
  } catch (error) {
    return next(error);
  }
};

const validateResetToken = async (req, res, next) => {
  try {
    await authService.validatePasswordResetToken(req.query.token);
    return sendSuccess(res, { valid: true }, 'Reset token is valid');
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body);
    return sendSuccess(res, null, 'Password reset successfully');
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const { refreshToken } = req.body || {};

    await authService.logout({ accessToken, refreshToken });

    return sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    return next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await userService.findById(req.user.userId);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, authService.toAuthUser(user), 'Profile fetched');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  forgotPassword,
  validateResetToken,
  resetPassword,
  logout,
  me,
};
