const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'message',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    emoji: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

reactionSchema.index({ messageId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('reaction', reactionSchema);
