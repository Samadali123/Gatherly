const Joi = require('joi');

const conversationSchema = Joi.object({
  receiver: Joi.string().trim().required(),
  before: Joi.date().iso(),
  limit: Joi.number().integer().min(1).max(50).default(30),
});

module.exports = {
  conversationSchema,
};
