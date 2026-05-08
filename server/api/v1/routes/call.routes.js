const express = require('express');
const callController = require('../controllers/call.controller');
const authenticate = require('../middlewares/auth.middleware');
const { cacheResponse } = require('../middlewares/cache.middleware');

const router = express.Router();

router.get('/', authenticate, cacheResponse({ ttlSeconds: 10 }), callController.listCallLogs);

module.exports = router;
