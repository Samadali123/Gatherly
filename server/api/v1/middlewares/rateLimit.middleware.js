const rateLimit = require('express-rate-limit');
const { sendError } = require('../../../utils/response');

const createRateLimiter = (options = {}) =>
  rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => sendError(res, 'Too many requests, please try again later', 429),
    ...options,
  });

module.exports = {
  createRateLimiter,
};
