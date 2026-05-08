const chatService = require('../../../services/chatService');
const userService = require('../../../services/userService');
const { sendError, sendSuccess } = require('../../../utils/response');

const getPinnedMessages = async (req, res, next) => {
  try {
    const messages = await chatService.getPinnedMessages(req.params.chatId);

    if (!messages.length) {
      return sendSuccess(res, [], 'Pinned messages fetched');
    }

    const user = await userService.findById(req.user.userId);

    if (!(await chatService.userCanAccessMessage(user, messages[0]))) {
      return sendError(res, 'You do not have permission to perform this action', 403);
    }

    return sendSuccess(res, messages, 'Pinned messages fetched');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getPinnedMessages,
};
