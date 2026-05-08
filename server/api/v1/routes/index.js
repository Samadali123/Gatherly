const express = require('express');
const authRoutes = require('./auth.routes');
const callRoutes = require('./call.routes');
const chatRoutes = require('./chat.routes');
const messageRoutes = require('./message.routes');
const pollRoutes = require('./poll.routes');
const roomRoutes = require('./room.routes');
const statusRoutes = require('./status.routes');
const userRoutes = require('./user.routes');
const { health } = require('../controllers/user.controller');

const router = express.Router();

router.get('/health', health);
router.use('/auth', authRoutes);
router.use('/calls', callRoutes);
router.use('/chat', chatRoutes);
router.use('/chats', chatRoutes);
router.use('/messages', messageRoutes);
router.use('/polls', pollRoutes);
router.use('/rooms', roomRoutes);
router.use('/statuses', statusRoutes);
router.use('/user', userRoutes);
router.use('/users', userRoutes);

module.exports = router;
