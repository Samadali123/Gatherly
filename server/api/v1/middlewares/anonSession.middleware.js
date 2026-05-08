const { sendError } = require('../../../utils/response');

const anonSession = (req, res, next) => {
  const session = req.signedCookies.anonSession;

  if (!session) {
    return sendError(res, 'Invalid or missing token', 401);
  }

  req.anonUser = session;
  return next();
};

module.exports = anonSession;
