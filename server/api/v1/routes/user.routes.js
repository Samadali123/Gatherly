const express = require('express');
const userController = require('../controllers/user.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const upload = require('../middlewares/upload.middleware');
const { cacheResponse } = require('../middlewares/cache.middleware');
const { profileSchema } = require('../validators/user.validator');

const router = express.Router();

router.get('/search', authenticate, cacheResponse({ ttlSeconds: 10 }), userController.search);
router.get('/check-username', authenticate, cacheResponse({ ttlSeconds: 20 }), userController.checkUsername);
router.get('/:id', authenticate, userController.getProfile);
router.post('/:id/follow', authenticate, userController.follow);
router.delete('/:id/follow', authenticate, userController.unfollow);
router.post('/:id/block', authenticate, userController.block);
router.delete('/:id/block', authenticate, userController.unblock);
router.patch('/profile', authenticate, validate(profileSchema), userController.updateProfile);
router.post('/avatar', authenticate, upload.single('avatar'), userController.updateAvatar);

module.exports = router;
