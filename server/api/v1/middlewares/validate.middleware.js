const { sendError } = require('../../../utils/response');

const formatJoiErrors = (error) =>
  error.details.map((detail) => ({
    field: detail.path.join('.'),
    message: detail.message,
  }));

const validate = (schema, property = 'body') => async (req, res, next) => {
  try {
    const validated = await schema.validateAsync(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });
    req[property] = validated;
    next();
  } catch (error) {
    return sendError(res, 'Validation failed', 422, formatJoiErrors(error));
  }
};

module.exports = validate;
