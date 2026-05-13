const messageModel = require('../models/message.model');
const prisma = require('../configs/prisma');
const groupService = require('./groupService');
const userService = require('./userService');
const socialService = require('./socialService');
const { buildDirectChatId, buildDirectChatIds, computeExpiresAt, isDirectChatId } = require('../utils/chat');
const { buildReplyToPreview } = require('../utils/replyPreview');

const resolveChatMeta = async ({ senderUser, receiver }) => {
  const receiverUser = (await userService.findByUsername(receiver)) || (await userService.findByEmail(receiver)) || (await userService.findByPhone(receiver));

  if (receiverUser) {
    const block = await socialService.getBlockBetween(senderUser._id, receiverUser._id);
    if (block) {
      const error = new Error(String(block.blockerId) === String(receiverUser._id) ? 'This user blocked you.' : 'You blocked this user.');
      error.statusCode = 403;
      throw error;
    }

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

const listDirectContactsForUser = async (user) => {
  if (!user?.username) return [];

  const messages = await prisma.message.findMany({
    where: {
      OR: [{ sender: user.username }, { receiver: user.username }],
      NOT: { hiddenFor: { has: user._id } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  const contactUsernames = [];
  const lastByUsername = new Map();

  messages.forEach((message) => {
    const other = message.sender === user.username ? message.receiver : message.sender;
    if (!other || lastByUsername.has(other)) return;
    contactUsernames.push(other);
    lastByUsername.set(other, message);
  });

  if (!contactUsernames.length) return [];

  const users = await prisma.user.findMany({
    where: { username: { in: contactUsernames } },
  });
  const byUsername = new Map(users.map((entry) => [entry.username, entry]));

  return contactUsernames
    .map((username) => {
      const contact = byUsername.get(username);
      const lastMessage = lastByUsername.get(username);
      if (!contact) return null;
      return {
        ...contact,
        lastMessagePreview: lastMessage?.msg || (lastMessage?.attachments?.length ? 'Attachment' : ''),
        lastMessageAt: lastMessage?.createdAt,
      };
    })
    .filter(Boolean);
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

const getConversation = async ({ sender, receiver, isGroupConversation, userId, before = null, limit = 30 }) => {
  if (isGroupConversation) {
    return { messages: [], hasMore: false, nextCursor: null };
  }

  const take = Math.min(Math.max(Number(limit) || 30, 1), 50);
  const rows = await messageModel
    .find({
      chatId: { $in: buildDirectChatIds(sender, receiver) },
      hiddenFor: { $ne: userId },
      ...(before ? { createdAt: { $lt: new Date(before) } } : {}),
    })
    .sort({ createdAt: -1 })
    .limit(take + 1);
  const hasMore = rows.length > take;
  const messages = rows.slice(0, take).reverse();

  return {
    messages,
    hasMore,
    nextCursor: hasMore ? messages[0]?.createdAt : null,
  };
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
  listDirectContactsForUser,
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
