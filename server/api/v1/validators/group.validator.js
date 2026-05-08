const Joi = require('joi');

const createGroupSchema = Joi.object({
  groupName: Joi.string().trim().min(1).required(),
});

const joinGroupSchema = Joi.object({
  groupName: Joi.string().trim().min(1).required(),
});

module.exports = {
  createGroupSchema,
  joinGroupSchema,
};
