const mongoose = require('mongoose');

const anonPollOptionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    votes: [
      {
        type: String,
      },
    ],
  },
  { _id: false }
);

const anonPollSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [anonPollOptionSchema],
      validate: [(options) => options.length >= 2, 'At least two options are required'],
    },
    createdBySessionId: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('anonPoll', anonPollSchema);
