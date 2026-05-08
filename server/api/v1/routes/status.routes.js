const express = require('express');
const authenticate = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const statusController = require('../controllers/status.controller');

const router = express.Router();

router.get('/', authenticate, statusController.listStatuses);
router.post('/', authenticate, statusController.createStatus);
router.post('/media', authenticate, upload.array('files', 1), statusController.uploadStatusMedia);
router.post('/:id/replies', authenticate, statusController.replyToStatus);
router.post('/:id/reactions', authenticate, statusController.reactToStatus);

module.exports = router;
