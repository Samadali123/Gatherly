const mongoose = require('mongoose');

const anonRoomSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 80,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    passwordHash: {
      type: String,
      default: null,
    },
    maxParticipants: {
      type: Number,
      default: 50,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('anonRoom', anonRoomSchema);
