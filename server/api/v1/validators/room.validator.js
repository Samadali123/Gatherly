const Joi = require('joi');

const roomExpirySchema = Joi.string().valid('1h', '24h', '7d').default('24h');

const createRoomSchema = Joi.object({
  name: Joi.string().trim().max(80).allow('', null).default(''),
  expiry: roomExpirySchema.optional(),
  expiresAt: Joi.date().greater('now').required(),
  password: Joi.string().allow('', null).default(null),
  maxParticipants: Joi.number().integer().min(2).max(10).default(10),
});

const joinRoomSchema = Joi.object({
  password: Joi.string().allow('', null).default(null),
});

const roomCodeSchema = Joi.object({
  code: Joi.string().trim().required(),
});

module.exports = {
  createRoomSchema,
  joinRoomSchema,
  roomCodeSchema,
};
