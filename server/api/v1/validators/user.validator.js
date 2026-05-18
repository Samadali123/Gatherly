const Joi = require('joi');

const profileSchema = Joi.object({
  displayName: Joi.string().trim().min(1).max(50),
  name: Joi.string().trim().min(1).max(50),
  username: Joi.string().trim().pattern(/^[a-zA-Z0-9_]{3,30}$/),
  bio: Joi.string().trim().max(160).allow(''),
  profileNote: Joi.string().trim().max(140).allow(''),
  phone: Joi.string().trim().max(24).pattern(/^[+()\-\s0-9]*$/).allow(''),
  newEmail: Joi.string().trim().email().lowercase(),
}).min(1);

module.exports = {
  profileSchema,
};
