const express = require('express');
const authenticate = require('../middlewares/auth.middleware');
const anonSession = require('../middlewares/anonSession.middleware');
const validate = require('../middlewares/validate.middleware');
const upload = require('../middlewares/upload.middleware');
const roomController = require('../controllers/room.controller');
const { cacheResponse } = require('../middlewares/cache.middleware');
const { createRateLimiter } = require('../middlewares/rateLimit.middleware');
const { createRoomSchema, joinRoomSchema } = require('../validators/room.validator');

const router = express.Router();

router.get('/', authenticate, cacheResponse({ ttlSeconds: 15 }), roomController.searchRooms);
router.post(
  '/',
  authenticate,
  createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => req.user.userId,
  }),
  validate(createRoomSchema),
  roomController.createRoom
);
router.get('/:code', cacheResponse({ ttlSeconds: 20, varyByUser: false }), roomController.getRoom);
router.post('/:code/join', validate(joinRoomSchema), roomController.joinRoom);
router.get('/:code/session', anonSession, roomController.getSession);
router.get('/:code/participants', anonSession, roomController.listParticipants);
router.get('/:code/messages', anonSession, roomController.listMessages);
router.post('/:code/attachments', anonSession, upload.array('files', 6), roomController.uploadAttachments);
router.post('/:code/meeting-token', authenticate, anonSession, roomController.createMeetingToken);
router.delete('/:code/meeting', authenticate, anonSession, roomController.endRoomMeeting);
router.get('/:code/polls', anonSession, roomController.listPolls);
router.delete('/:code/participants/:sessionId', authenticate, roomController.removeParticipant);

module.exports = router;
