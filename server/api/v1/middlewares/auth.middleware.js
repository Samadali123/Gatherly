const jwt = require('jsonwebtoken');
const config = require('../../../configs');
const userModel = require('../../../models/user.model');
const { sendError } = require('../../../utils/response');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Access token missing', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET);
    const user = await userModel.findById(decoded.userId).select('_id tokenVersion');

    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      return sendError(res, 'Session expired, please login again', 401);
    }

    req.user = decoded;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Access token expired', 401);
    }

    return sendError(res, 'Invalid access token', 401);
  }
};

module.exports = authenticate;
