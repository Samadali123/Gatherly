const mongoose = require('mongoose');

const anonParticipantSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    alias: {
      type: String,
      required: true,
    },
    avatarColor: {
      type: String,
      required: true,
    },
    avatarAnimal: {
      type: String,
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    isOnline: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

anonParticipantSchema.index({ roomCode: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model('anonParticipant', anonParticipantSchema);
