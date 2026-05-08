const mongoose = require('mongoose');

const replyToSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      default: '',
    },
    senderId: {
      type: String,
      default: '',
    },
    senderName: {
      type: String,
      default: '',
    },
    contentPreview: {
      type: String,
      maxlength: 100,
      default: '',
    },
    contentType: {
      type: String,
      enum: ['text', 'image', 'file'],
      default: 'text',
    },
    mediaUrl: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const anonMessageSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    alias: {
      type: String,
      required: true,
    },
    avatarColor: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    pinnedBySessionId: {
      type: String,
      default: null,
    },
    parentMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'anonMessage',
      default: null,
      index: true,
    },
    replyTo: {
      type: replyToSchema,
      default: null,
    },
    reactions: [
      {
        sessionId: String,
        emoji: String,
      },
    ],
    attachments: [
      {
        type: {
          type: String,
          enum: ['image', 'video', 'document', 'audio', 'sticker', 'gif'],
          required: true,
        },
        url: {
          type: String,
          default: '',
        },
        value: {
          type: String,
          default: '',
        },
        gifUrl: {
          type: String,
          default: '',
        },
        previewUrl: {
          type: String,
          default: '',
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

module.exports = mongoose.model('anonMessage', anonMessageSchema);
