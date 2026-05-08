const cron = require('node-cron');
const roomService = require('../services/roomService');
const logger = require('../utils/logger');
const { emitToSocket } = require('../sockets/emitter');

const startExpireRoomsJob = () =>
  cron.schedule('*/5 * * * *', async () => {
    try {
      const rooms = await roomService.listExpiredRooms(new Date());

      if (!rooms.length) {
        return;
      }

      await roomService.deactivateRooms(rooms.map((room) => room._id));

      rooms.forEach((room) => {
        emitToSocket(`anon:${room.code}`, 'room:expired', { code: room.code });
      });
    } catch (error) {
      logger.error(`expireRooms job failed: ${error.message}`);
    }
  });

module.exports = startExpireRoomsJob;
