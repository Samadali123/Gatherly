const express = require('express');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const pollController = require('../controllers/poll.controller');
const { createPollSchema, voteSchema } = require('../validators/poll.validator');

const router = express.Router();

router.post('/', authenticate, validate(createPollSchema), pollController.createPoll);
router.post('/:id/vote', authenticate, validate(voteSchema), pollController.votePoll);
router.get('/:id', authenticate, pollController.getPoll);

module.exports = router;
