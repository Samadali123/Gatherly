const chatService = require('../../services/chatService');
const userService = require('../../services/userService');
const { emitToUser } = require('../emitter');
const logger = require('../../utils/logger');

const registerChatHandlers = (io, socket) => {
  socket.on('private-message', async (messageObject) => {
    try {
      const currentUser = await userService.findById(socket.user.userId);

      if (!currentUser) {
        return;
      }

      const { message, chatMeta } = await chatService.createMessage({
        message: messageObject.message,
        senderUser: currentUser,
        receiver: messageObject.receiver,
        ttl: messageObject.ttl || null,
        parentMessageId: messageObject.parentMessageId || null,
      });

      const payload = {
        messageId: message._id,
        chatId: message.chatId,
        message,
        senderUser: {
          id: currentUser._id,
          name: currentUser.name,
          username: currentUser.username || currentUser.email,
          email: currentUser.email,
          avatar: currentUser.avatar,
          profileImage: currentUser.profileImage,
        },
      };

      await emitToUser(chatMeta.receiverUser._id, 'receive-private-message', payload, currentUser._id);
    } catch (error) {
      logger.error(`private-message failed: ${error.message}`);
    }
  });

  socket.on('fetch-conversation', async (conversationDetails) => {
    try {
      const currentUser = await userService.findById(socket.user.userId);

      if (!currentUser) {
        return;
      }

      const allMessages = await chatService.getConversation({
        sender: currentUser.username || currentUser.email,
        receiver: conversationDetails.receiver,
        isGroupConversation: false,
      });

      socket.emit('send-conversation', allMessages);
    } catch (error) {
      logger.error(`fetch-conversation failed: ${error.message}`);
    }
  });
};

module.exports = registerChatHandlers;
