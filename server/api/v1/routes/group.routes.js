const express = require('express');
const groupController = require('../controllers/group.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { createGroupSchema, joinGroupSchema } = require('../validators/group.validator');

const router = express.Router();

router.post('/', authenticate, validate(createGroupSchema), groupController.createGroup);
router.post('/join', authenticate, validate(joinGroupSchema), groupController.joinGroup);

module.exports = router;
