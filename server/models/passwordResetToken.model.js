const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      index: true,
    },
    userType: {
      type: String,
      enum: ['personal', 'professional'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  {
    collection: 'password_reset_tokens',
    timestamps: true,
  }
);

module.exports = mongoose.model('password_reset_token', passwordResetTokenSchema);
