const Joi = require('joi');
const emojiRegex = require('emoji-regex');

const ttlSchema = Joi.string().valid('5m', '1h', '24h', '7d', null).allow(null);

const idPattern = /^[A-Za-z0-9_-]{8,80}$/;

const attachmentSchema = Joi.object({
  type: Joi.string().valid('image', 'video', 'document', 'audio', 'sticker', 'gif').required(),
  url: Joi.when('type', {
    switch: [
      { is: 'sticker', then: Joi.string().allow('', null).default('') },
      { is: 'gif', then: Joi.string().allow('', null).default('') },
    ],
    otherwise: Joi.string().uri().required(),
  }),
  value: Joi.string().trim().max(80).allow('', null).default(''),
  gifUrl: Joi.when('type', {
    is: 'gif',
    then: Joi.string().uri().required(),
    otherwise: Joi.string().uri().allow('', null).default(''),
  }),
  previewUrl: Joi.when('type', {
    is: 'gif',
    then: Joi.string().uri().required(),
    otherwise: Joi.string().uri().allow('', null).default(''),
  }),
});

const statusContextSchema = Joi.object({
  statusId: Joi.string().pattern(idPattern).allow(null),
  type: Joi.string().valid('text', 'image', 'video', null).allow(null),
  text: Joi.string().allow('', null).default(''),
  mediaUrl: Joi.string().uri().allow('', null).default(''),
}).allow(null);

const createMessageSchema = Joi.object({
  receiver: Joi.string().trim().required(),
  message: Joi.string().trim().allow('').default(''),
  ttl: ttlSchema.default(null),
  parentMessageId: Joi.string().pattern(idPattern).allow(null).default(null),
  attachments: Joi.array().items(attachmentSchema).max(6).default([]),
  statusContext: statusContextSchema.default(null),
}).custom((value, helpers) => {
  if (!value.message && !value.attachments.length) {
    return helpers.message('message or attachment is required');
  }

  const videos = value.attachments.filter((attachment) => attachment.type === 'video');
  const documents = value.attachments.filter((attachment) => attachment.type === 'document');
  const audios = value.attachments.filter((attachment) => attachment.type === 'audio');

  if (videos.length > 1 || documents.length > 1 || audios.length > 1) {
    return helpers.message('only one video, document, or recording can be sent at a time');
  }

  return value;
});

const pinMessageSchema = Joi.object({
  id: Joi.string().pattern(idPattern).required(),
});

const getThreadSchema = Joi.object({
  id: Joi.string().pattern(idPattern).required(),
});

const getPinsSchema = Joi.object({
  chatId: Joi.string().trim().required(),
});

const reactionSchema = Joi.object({
  emoji: Joi.string()
    .trim()
    .custom((value, helpers) => {
      const matches = value.match(emojiRegex()) || [];

      if (matches.length !== 1 || matches[0] !== value) {
        return helpers.message('emoji must be a single valid emoji character');
      }

      return value;
    }, 'emoji validation')
    .required(),
});

module.exports = {
  createMessageSchema,
  pinMessageSchema,
  getThreadSchema,
  getPinsSchema,
  reactionSchema,
};
