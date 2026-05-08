const chatService = require('../../../services/chatService');
const groupService = require('../../../services/groupService');
const reactionService = require('../../../services/reactionService');
const userService = require('../../../services/userService');
const { emitToUser } = require('../../../sockets/emitter');
const { sendSuccess } = require('../../../utils/response');
const { buildDirectChatId } = require('../../../utils/chat');

const getConversation = async (req, res, next) => {
  try {
    const senderUser = await userService.findById(req.user.userId);
    const { receiver } = req.query;

    if (!senderUser) {
      return next(Object.assign(new Error('User not found'), { statusCode: 404 }));
    }

    const receiverUser = await userService.findByUsername(receiver);
    if (!receiverUser) {
      return sendSuccess(res, [], 'Conversation fetched');
    }

    const messages = await chatService.getConversation({
      sender: senderUser.username,
      receiver,
      isGroupConversation: false,
      userId: req.user.userId,
    });

    const messagesWithReactions = await reactionService.summarizeForMessages(messages, req.user.userId);
    return sendSuccess(res, messagesWithReactions, 'Conversation fetched');
  } catch (error) {
    return next(error);
  }
};

const clearConversation = async (req, res, next) => {
  try {
    const senderUser = await userService.findById(req.user.userId);
    const receiverUser = await userService.findByUsername(req.query.receiver);

    if (!senderUser || !receiverUser) {
      return sendSuccess(res, null, 'Conversation cleared');
    }

    await chatService.clearConversationForUser({
      chatId: buildDirectChatId(senderUser.username, receiverUser.username),
      userId: req.user.userId,
    });

    return sendSuccess(res, null, 'Conversation cleared');
  } catch (error) {
    return next(error);
  }
};

const markConversationRead = async (req, res, next) => {
  try {
    const senderUser = await userService.findById(req.user.userId);
    const receiverUser = await userService.findByUsername(req.query.receiver);

    if (!senderUser || !receiverUser) {
      return sendSuccess(res, null, 'Conversation marked read');
    }

    const chatId = buildDirectChatId(senderUser.username, receiverUser.username);
    await chatService.markConversationRead({
      chatId,
      username: senderUser.username,
      userId: req.user.userId,
    });
    await emitToUser(receiverUser._id, 'message:read', {
      chatId,
      readerId: req.user.userId,
      readerUsername: senderUser.username,
    }, req.user.userId);

    return sendSuccess(res, { chatId, readerId: req.user.userId }, 'Conversation marked read');
  } catch (error) {
    return next(error);
  }
};

const getGroups = async (req, res, next) => {
  try {
    const currentUser = await userService.findById(req.user.userId);
    const groups = currentUser ? await groupService.listForUser(currentUser._id) : [];
    return sendSuccess(res, groups, 'Groups fetched');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getConversation,
  clearConversation,
  markConversationRead,
  getGroups,
};
