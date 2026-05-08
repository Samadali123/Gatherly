const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('personal', 'professional').default('personal'),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
  role: Joi.string().valid('personal', 'professional').default('personal'),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
});

const validateResetTokenSchema = Joi.object({
  token: Joi.string().trim().hex().length(64).required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().trim().hex().length(64).required(),
  newPassword: Joi.string().min(8).required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  validateResetTokenSchema,
  resetPasswordSchema,
};
