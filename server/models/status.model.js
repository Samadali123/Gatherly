const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video'],
      required: true,
    },
    text: {
      type: String,
      trim: true,
      default: '',
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    style: {
      background: { type: String, default: '#245143' },
      color: { type: String, default: '#FFFFFF' },
      align: { type: String, default: 'center' },
      fontSize: { type: Number, default: 28 },
      bold: { type: Boolean, default: false },
      italic: { type: Boolean, default: false },
    },
    replies: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        emoji: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('status', statusSchema);
