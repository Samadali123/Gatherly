const logger = require('../../../utils/logger');
const { sendError } = require('../../../utils/response');

const isPrismaError = (err) =>
  typeof err.code === 'string' && /^P\d{4}$/.test(err.code);

const isDatabaseConnectivityError = (err) =>
  ['ECONNREFUSED', 'ETIMEDOUT', 'EHOSTUNREACH', 'ENOTFOUND', 'EACCES'].includes(err.code) ||
  /database|connection|timeout|connect/i.test(err.message || '');

const getSafeInternalMessage = (err) => {
  const rawMessage = String(err.message || '');

  if (err.code === 'P2021' || rawMessage.includes('does not exist in the current database')) {
    return {
      statusCode: 503,
      message: 'The app database is not ready yet. Please try again after setup is complete.',
    };
  }

  if (isPrismaError(err) || isDatabaseConnectivityError(err)) {
    return {
      statusCode: 503,
      message: 'We are having trouble reaching the database. Please try again in a moment.',
    };
  }

  return {
    statusCode: 500,
    message: 'Something went wrong. Please try again.',
  };
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errors = err.errors || null;

  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed';
    errors = Object.keys(err.errors || {}).map((field) => ({
      field,
      message: err.errors[field].message,
    }));
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid request data';
    errors = [{ field: err.path, message: `Invalid value for ${err.path}` }];
  }

  if (err.name === 'MongoServerError' && err.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(err.keyPattern || {})[0] || 'resource';
    message = `${duplicateField} already exists`;
    errors = [{ field: duplicateField, message }];
  }

  if (err.code === 'P2002') {
    statusCode = 409;
    const duplicateField = Array.isArray(err.meta?.target) ? err.meta.target[0] : 'resource';
    message = duplicateField === 'email'
      ? 'This email is already registered. Please sign in instead.'
      : duplicateField === 'phone'
        ? 'This phone number is already registered. Please sign in instead.'
        : duplicateField === 'username'
          ? 'This username is already taken. Please choose another one.'
          : 'This information is already in use.';
    errors = [{ field: duplicateField, message }];
  }

  if (statusCode >= 500 || (isPrismaError(err) && err.code !== 'P2002')) {
    const safe = getSafeInternalMessage(err);
    statusCode = safe.statusCode;
    message = safe.message;
    errors = null;
  }

  logger.error(`${req.method} ${req.originalUrl} -> ${statusCode} ${message} :: ${err.stack || err.message || err}`);

  return sendError(res, message, statusCode, errors);
};

module.exports = errorHandler;
