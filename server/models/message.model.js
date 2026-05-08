const mongoose = require('mongoose');

const ttlValues = [null, '5m', '1h', '24h', '7d'];

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

const messageSchema = new mongoose.Schema(
  {
    msg: {
      type: String,
      trim: true,
      default: '',
    },
    sender: {
      type: String,
      required: true,
    },
    receiver: {
      type: String,
      required: true,
    },
    chatId: {
      type: String,
      index: true,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    ttl: {
      type: String,
      enum: ttlValues,
      default: null,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: null,
    },
    parentMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'message',
      default: null,
      index: true,
    },
    replyTo: {
      type: replyToSchema,
      default: null,
    },
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
    hiddenFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
      },
    ],
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
      },
    ],
    statusContext: {
      statusId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'status',
        default: null,
      },
      type: {
        type: String,
        enum: ['text', 'image', 'video', null],
        default: null,
      },
      text: {
        type: String,
        default: '',
      },
      mediaUrl: {
        type: String,
        default: '',
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('message', messageSchema);
