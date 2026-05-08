const logger = require('../../../utils/logger');
const { sendError } = require('../../../utils/response');

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

  logger.error(`${req.method} ${req.originalUrl} -> ${statusCode} ${message}`);

  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    return sendError(res, 'Something went wrong', statusCode);
  }

  return sendError(res, message, statusCode, errors);
};

module.exports = errorHandler;
