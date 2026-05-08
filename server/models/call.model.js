const mongoose = require('mongoose');

const callSchema = new mongoose.Schema(
  {
    callId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: null,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['calling', 'ringing', 'connected', 'rejected', 'missed', 'ended'],
      default: 'calling',
      index: true,
    },
    type: {
      type: String,
      enum: ['one-to-one', 'anonymous', 'room'],
      default: 'one-to-one',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    connectedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('call', callSchema);
