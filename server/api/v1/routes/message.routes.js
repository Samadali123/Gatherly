const express = require('express');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const upload = require('../middlewares/upload.middleware');
const messageController = require('../controllers/message.controller');
const {
  createMessageSchema,
  reactionSchema,
} = require('../validators/message.validator');

const router = express.Router();

router.post('/', authenticate, validate(createMessageSchema), messageController.createMessage);
router.post('/attachments', authenticate, upload.array('files', 6), messageController.uploadAttachments);
router.delete('/:id', authenticate, messageController.deleteMessage);
router.post('/:id/pin', authenticate, messageController.pinMessage);
router.delete('/:id/pin', authenticate, messageController.unpinMessage);
router.get('/:id/thread', authenticate, messageController.getThread);
router.post('/:id/reactions', authenticate, validate(reactionSchema), messageController.addReaction);
router.delete('/:id/reactions/:emoji', authenticate, messageController.removeReaction);

module.exports = router;
