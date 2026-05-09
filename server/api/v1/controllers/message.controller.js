const chatService = require('../../../services/chatService');
const reactionService = require('../../../services/reactionService');
const uploadService = require('../../../services/uploadService');
const userService = require('../../../services/userService');
const { emitToChatMembers, emitToUser } = require('../../../sockets/emitter');
const { sendError, sendSuccess } = require('../../../utils/response');

const createMessage = async (req, res, next) => {
  try {
    const senderUser = await userService.findById(req.user.userId);

    if (!senderUser) {
      return sendError(res, 'User not found', 404);
    }

    const { message, chatMeta } = await chatService.createMessage({
      message: req.body.message,
      senderUser,
      receiver: req.body.receiver,
      ttl: req.body.ttl,
      parentMessageId: req.body.parentMessageId,
      attachments: req.body.attachments,
      statusContext: req.body.statusContext,
    });

    const payload = {
      messageId: message._id,
      chatId: message.chatId,
      message,
      senderUser: {
        id: senderUser._id,
        name: senderUser.name,
        username: senderUser.username || senderUser.email,
        email: senderUser.email,
        avatar: senderUser.avatar,
        profileImage: senderUser.profileImage,
      },
    };

    if (chatMeta.receiverUser) {
      await emitToUser(chatMeta.receiverUser._id, 'receive-private-message', payload, senderUser._id);
    } else if (chatMeta.group) {
      const populatedGroup = await chatMeta.group.populate('users');
      await Promise.all(
        populatedGroup.users
          .filter((member) => member._id.toString() !== senderUser._id.toString())
          .map((member) => emitToUser(member._id, 'receive-private-message', payload, senderUser._id))
      );
    }

    return sendSuccess(res, message, 'Message sent', 201);
  } catch (error) {
    return next(error);
  }
};

const uploadAttachments = async (req, res, next) => {
  try {
    const attachments = await uploadService.uploadAttachments({
      files: req.files || [],
      type: req.body.type,
      folder: `gatherly/direct/${req.user.userId}`,
    });

    return sendSuccess(res, attachments, 'Attachments uploaded', 201);
  } catch (error) {
    return next(error);
  }
};

const isMessageOwner = (message, user) =>
  Boolean(user && [user.username, user.email].filter(Boolean).includes(message.sender));

const hasMessageId = (id) => typeof id === 'string' && id.trim().length >= 8;

const pinMessage = async (req, res, next) => {
  try {
    if (!hasMessageId(req.params.id)) {
      return sendError(res, 'Message not ready yet. Please try again.', 400);
    }

    const user = await userService.findById(req.user.userId);
    const message = await chatService.findMessageById(req.params.id);

    if (!message) {
      return sendError(res, 'Message not found', 404);
    }

    if (!(await chatService.userCanAccessMessage(user, message))) {
      return sendError(res, 'You do not have permission to perform this action', 403);
    }

    const updated = await chatService.pinMessage(message._id, user._id);

    await emitToChatMembers(updated.chatId, 'message:pinned', {
      message: updated,
      chatId: updated.chatId,
      pinnedBy: user._id,
    }, user._id);

    return sendSuccess(res, updated, 'Message pinned');
  } catch (error) {
    return next(error);
  }
};

const unpinMessage = async (req, res, next) => {
  try {
    if (!hasMessageId(req.params.id)) {
      return sendError(res, 'Message not ready yet. Please try again.', 400);
    }

    const user = await userService.findById(req.user.userId);
    const message = await chatService.findMessageById(req.params.id);

    if (!message) {
      return sendError(res, 'Message not found', 404);
    }

    if (!message.isPinned || !message.pinnedBy || String(message.pinnedBy) !== String(user?._id)) {
      return sendError(res, 'You do not have permission to perform this action', 403);
    }

    await chatService.unpinMessage(message._id);

    await emitToChatMembers(message.chatId, 'message:unpinned', {
      messageId: message._id,
      chatId: message.chatId,
    }, user._id);

    return sendSuccess(res, null, 'Message unpinned');
  } catch (error) {
    return next(error);
  }
};

const getThread = async (req, res, next) => {
  try {
    if (!hasMessageId(req.params.id)) {
      return sendError(res, 'Message not ready yet. Please try again.', 400);
    }

    const thread = await chatService.getThread(req.params.id);

    if (!thread) {
      return sendError(res, 'Message not found', 404);
    }

    const user = await userService.findById(req.user.userId);

    if (!(await chatService.userCanAccessMessage(user, thread.parent))) {
      return sendError(res, 'You do not have permission to perform this action', 403);
    }

    return sendSuccess(res, thread, 'Thread fetched');
  } catch (error) {
    return next(error);
  }
};

const addReaction = async (req, res, next) => {
  try {
    if (!hasMessageId(req.params.id)) {
      return sendError(res, 'Message not ready yet. Please try again.', 400);
    }

    const message = await chatService.findMessageById(req.params.id);

    if (!message) {
      return sendError(res, 'Message not found', 404);
    }

    if (!(await chatService.userCanAccessMessage(await userService.findById(req.user.userId), message))) {
      return sendError(res, 'You do not have permission to perform this action', 403);
    }

    const user = await userService.findById(req.user.userId);

    const { reaction, count, previousEmoji, previousCount } = await reactionService.addReaction({
      messageId: message._id,
      userId: req.user.userId,
      emoji: req.body.emoji,
    });

    if (previousEmoji) {
      await emitToChatMembers(message.chatId, 'reaction:removed', {
        messageId: message._id,
        emoji: previousEmoji,
        userId: req.user.userId,
        count: previousCount,
      }, req.user.userId);
    }

    await emitToChatMembers(message.chatId, 'reaction:added', {
      messageId: message._id,
      emoji: req.body.emoji,
      userId: req.user.userId,
      count,
    }, req.user.userId);

    return sendSuccess(res, reaction, 'Reaction added', 201);
  } catch (error) {
    if (error.code === 11000) {
      return sendSuccess(res, null, 'Reaction already exists');
    }

    return next(error);
  }
};

const removeReaction = async (req, res, next) => {
  try {
    if (!hasMessageId(req.params.id)) {
      return sendError(res, 'Message not ready yet. Please try again.', 400);
    }

    const message = await chatService.findMessageById(req.params.id);

    if (!message) {
      return sendError(res, 'Message not found', 404);
    }

    const { count } = await reactionService.removeReaction({
      messageId: message._id,
      userId: req.user.userId,
      emoji: req.params.emoji,
    });

    await emitToChatMembers(message.chatId, 'reaction:removed', {
      messageId: message._id,
      emoji: req.params.emoji,
      userId: req.user.userId,
      count,
    }, req.user.userId);

    return sendSuccess(res, null, 'Reaction removed');
  } catch (error) {
    return next(error);
  }
};

const deleteMessage = async (req, res, next) => {
  try {
    if (!hasMessageId(req.params.id)) {
      return sendError(res, 'Message not ready yet. Please try again.', 400);
    }

    const user = await userService.findById(req.user.userId);
    const message = await chatService.findMessageById(req.params.id);

    if (!message) {
      return sendError(res, 'Message not found', 404);
    }

    if (!isMessageOwner(message, user)) {
      return sendError(res, 'You do not have permission to perform this action', 403);
    }

    await chatService.deleteMessage(message._id);
    await emitToChatMembers(message.chatId, 'message:deleted', {
      messageId: message._id,
      chatId: message.chatId,
    }, user._id);

    return sendSuccess(res, null, 'Message deleted');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createMessage,
  pinMessage,
  unpinMessage,
  getThread,
  deleteMessage,
  addReaction,
  removeReaction,
  uploadAttachments,
};
