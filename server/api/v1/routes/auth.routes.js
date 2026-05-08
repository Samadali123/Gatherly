const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const authenticate = require('../middlewares/auth.middleware');
const { createRateLimiter } = require('../middlewares/rateLimit.middleware');
const {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  validateResetTokenSchema,
} = require('../validators/auth.validator');

const router = express.Router();
const authLimiter = createRateLimiter({ max: 20, windowMs: 15 * 60 * 1000 });
const passwordResetLimiter = createRateLimiter({ max: 5, windowMs: 60 * 60 * 1000 });

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authLimiter, authController.refresh);
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.get('/validate-reset-token', validate(validateResetTokenSchema, 'query'), authController.validateResetToken);
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;
