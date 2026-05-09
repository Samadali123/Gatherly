const config = require('../configs');

const REFRESH_COOKIE_NAME = 'refreshToken';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: config.COOKIE_SECURE,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

module.exports = {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_OPTIONS,
};
