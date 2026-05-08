const express = require('express');
const userController = require('../controllers/user.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const upload = require('../middlewares/upload.middleware');
const { cacheResponse } = require('../middlewares/cache.middleware');
const { dndSchema, profileSchema } = require('../validators/user.validator');

const router = express.Router();

router.get('/search', authenticate, cacheResponse({ ttlSeconds: 10 }), userController.search);
router.get('/check-username', authenticate, cacheResponse({ ttlSeconds: 20 }), userController.checkUsername);
router.patch('/profile', authenticate, validate(profileSchema), userController.updateProfile);
router.post('/avatar', authenticate, upload.single('avatar'), userController.updateAvatar);
router.patch('/me/dnd', authenticate, validate(dndSchema), userController.updateDnd);

module.exports = router;
