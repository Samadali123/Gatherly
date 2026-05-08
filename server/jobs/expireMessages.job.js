const cron = require('node-cron');
const chatService = require('../services/chatService');
const logger = require('../utils/logger');
const { emitToChatMembers } = require('../sockets/emitter');

const startExpireMessagesJob = () =>
  cron.schedule('* * * * *', async () => {
    try {
      const messages = await chatService.findExpiringMessages(new Date());

      if (!messages.length) {
        return;
      }

      await chatService.deleteExpiredMessages(messages.map((message) => message._id));

      await Promise.all(
        messages.map((message) =>
          emitToChatMembers(message.chatId, 'message:expired', {
          messageId: message._id,
          chatId: message.chatId,
          })
        )
      );
    } catch (error) {
      logger.error(`expireMessages job failed: ${error.message}`);
    }
  });

module.exports = startExpireMessagesJob;
