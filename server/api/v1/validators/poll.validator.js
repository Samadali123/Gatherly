const Joi = require('joi');

const createPollSchema = Joi.object({
  question: Joi.string().trim().min(1).required(),
  options: Joi.array().items(Joi.string().trim().min(1)).min(2).required(),
  chatId: Joi.string().trim().required(),
  expiresAt: Joi.date().iso().allow(null).default(null),
  isAnonymous: Joi.boolean().default(false),
});

const voteSchema = Joi.object({
  optionId: Joi.string().trim().required(),
});

module.exports = {
  createPollSchema,
  voteSchema,
};
