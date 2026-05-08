const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      lowercase: true,
      default: null,
    },
    number: {
      type: Number,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 160,
      default: '',
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['personal', 'professional', 'user'],
      default: 'personal',
    },
    profileImage: {
      type: String,
      default:
        'https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-image-182145777.jpg',
    },
    avatar: {
      type: String,
      default: null,
    },
    socketId: {
      type: String,
      default: '',
    },
    refreshTokenHash: {
      type: String,
      default: null,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    dndEnabled: {
      type: Boolean,
      default: false,
    },
    dndSchedule: {
      from: {
        type: String,
        default: null,
      },
      to: {
        type: String,
        default: null,
      },
    },
    dndPeriod: {
      from: {
        type: Date,
        default: null,
      },
      to: {
        type: Date,
        default: null,
      },
    },
    dndWhitelist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('user', userSchema);
