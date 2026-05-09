const messageModel = require('../models/message.model');
const groupService = require('./groupService');
const userService = require('./userService');
const { buildDirectChatId, buildDirectChatIds, computeExpiresAt, isDirectChatId } = require('../utils/chat');
const { buildReplyToPreview } = require('../utils/replyPreview');

const resolveChatMeta = async ({ senderUser, receiver }) => {
  const receiverUser = await userService.findByUsername(receiver);

  if (receiverUser) {
    return {
      type: 'dm',
      chatId: buildDirectChatId(senderUser.username, receiverUser.username),
      receiverUser,
      group: null,
    };
  }

  const error = new Error('User not found');
  error.statusCode = 404;
  throw error;
};

const createMessage = async ({ message, senderUser, receiver, ttl = null, parentMessageId = null, attachments = [], statusContext = null }) => {
  const chatMeta = await resolveChatMeta({ senderUser, receiver });
  const expiresAt = computeExpiresAt(ttl);
  let replyTo = null;

  if (parentMessageId) {
    const parent = await messageModel.findById(parentMessageId);

    if (!parent || parent.chatId !== chatMeta.chatId) {
      const error = new Error('You cannot reply to this message');
      error.statusCode = 403;
      throw error;
    }

    const parentSender = await userService.findByUsername(parent.sender);
    replyTo = buildReplyToPreview({
      message: parent,
      senderId: parentSender?._id || parent.sender,
      senderName: parentSender?.name || parentSender?.username || parent.sender,
    });
  }

  const created = await messageModel.create({
    msg: message,
    sender: senderUser.username,
    receiver,
    chatId: chatMeta.chatId,
    ttl,
    expiresAt,
    parentMessageId,
    replyTo,
    attachments,
    statusContext,
  });

  return { message: created, chatMeta };
};

const getConversation = async ({ sender, receiver, isGroupConversation, userId }) => {
  if (isGroupConversation) {
    return [];
  }

  return messageModel
    .find({
      chatId: { $in: buildDirectChatIds(sender, receiver) },
      hiddenFor: { $ne: userId },
    })
    .sort({ createdAt: 1 });
};

const findMessageById = (id) => messageModel.findById(id);

const getPinnedMessages = (chatId) =>
  messageModel.find({ chatId, isPinned: true }).sort({ updatedAt: -1 }).populate('pinnedBy', 'name email username');

const getThread = async (messageId) => {
  const parent = await messageModel.findById(messageId);

  if (!parent) {
    return null;
  }

  const replies = await messageModel.find({ parentMessageId: parent._id }).sort({ createdAt: 1 });
  return { parent, replies };
};

const pinMessage = async (messageId, pinnedBy) =>
  messageModel
    .findByIdAndUpdate(
      messageId,
      { isPinned: true, pinnedBy },
      { new: true }
    )
    .populate('pinnedBy', 'name email username');

const unpinMessage = (messageId) =>
  messageModel.findByIdAndUpdate(messageId, { isPinned: false, pinnedBy: null }, { new: true });

const deleteMessage = (messageId) => messageModel.findByIdAndDelete(messageId);

const findExpiringMessages = (now) => messageModel.find({ expiresAt: { $lte: now } });

const deleteExpiredMessages = (messageIds) => messageModel.deleteMany({ _id: { $in: messageIds } });

const clearConversationForUser = ({ chatId, userId }) =>
  messageModel.updateMany({ chatId }, { $addToSet: { hiddenFor: userId } });

const markConversationRead = ({ chatId, username, userId }) =>
  messageModel.updateMany(
    {
      chatId,
      receiver: username,
      readBy: { $ne: userId },
    },
    { $addToSet: { readBy: userId } }
  );

const userCanAccessMessage = async (user, message) => {
  if (!user || !message) {
    return false;
  }

  if (message.chatId && !isDirectChatId(message.chatId)) {
    const group = await groupService.findById(message.chatId);
    return !!group && group.users.some((userId) => userId.toString() === user._id.toString());
  }

  return [message.sender, message.receiver].includes(user.username);
};

module.exports = {
  resolveChatMeta,
  createMessage,
  getConversation,
  findMessageById,
  getPinnedMessages,
  getThread,
  pinMessage,
  unpinMessage,
  deleteMessage,
  findExpiringMessages,
  deleteExpiredMessages,
  clearConversationForUser,
  markConversationRead,
  userCanAccessMessage,
};
