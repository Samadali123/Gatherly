const Joi = require('joi');

const conversationSchema = Joi.object({
  receiver: Joi.string().trim().required(),
});

module.exports = {
  conversationSchema,
};
