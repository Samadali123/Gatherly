const express = require('express');
const chatController = require('../controllers/chat.controller');
const chatFeatureController = require('../controllers/chatFeature.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { conversationSchema } = require('../validators/chat.validator');

const router = express.Router();

router.get('/conversation', authenticate, validate(conversationSchema, 'query'), chatController.getConversation);
router.post('/conversation/read', authenticate, validate(conversationSchema, 'query'), chatController.markConversationRead);
router.delete('/conversation', authenticate, validate(conversationSchema, 'query'), chatController.clearConversation);
router.get('/:chatId/pins', authenticate, chatFeatureController.getPinnedMessages);

module.exports = router;
