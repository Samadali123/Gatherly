const { sendError } = require('../../../utils/response');

const readHeaderSession = (req) => {
  const encoded = req.get('x-anon-session');
  if (!encoded) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  } catch {
    return null;
  }
};

const anonSession = (req, res, next) => {
  const session = req.signedCookies.anonSession || readHeaderSession(req);

  if (!session) {
    return sendError(res, 'Please join this room again to continue.', 401);
  }

  req.anonUser = session;
  return next();
};

module.exports = anonSession;
