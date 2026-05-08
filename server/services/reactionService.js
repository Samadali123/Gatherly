const reactionModel = require('../models/reaction.model');

const addReaction = async ({ messageId, userId, emoji }) => {
  const previous = await reactionModel.findOne({ messageId, userId });
  const previousEmoji = previous && previous.emoji !== emoji ? previous.emoji : null;

  const reaction = await reactionModel.findOneAndUpdate(
    { messageId, userId },
    { messageId, userId, emoji },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const count = await reactionModel.countDocuments({ messageId, emoji });
  const previousCount = previousEmoji ? await reactionModel.countDocuments({ messageId, emoji: previousEmoji }) : null;

  return { reaction, count, previousEmoji, previousCount };
};

const summarizeForMessages = async (messages, userId) => {
  const plainMessages = messages.map((message) => (typeof message.toObject === 'function' ? message.toObject() : message));
  const ids = plainMessages.map((message) => message._id).filter(Boolean);

  if (!ids.length) {
    return plainMessages;
  }

  const reactions = await reactionModel.find({ messageId: { $in: ids } });
  const byMessage = new Map();

  reactions.forEach((reaction) => {
    const messageId = reaction.messageId.toString();
    const entries = byMessage.get(messageId) || new Map();
    const current = entries.get(reaction.emoji) || { emoji: reaction.emoji, count: 0, reacted: false };
    entries.set(reaction.emoji, {
      ...current,
      count: current.count + 1,
      reacted: current.reacted || reaction.userId.toString() === userId.toString(),
    });
    byMessage.set(messageId, entries);
  });

  return plainMessages.map((message) => ({
    ...message,
    reactions: Array.from(byMessage.get(message._id.toString())?.values() || []),
  }));
};

const removeReaction = async ({ messageId, userId, emoji }) => {
  const reaction = await reactionModel.findOneAndDelete({ messageId, userId, emoji });

  if (!reaction) {
    const error = new Error('Reaction not found');
    error.statusCode = 404;
    throw error;
  }

  const count = await reactionModel.countDocuments({ messageId, emoji });

  return { reaction, count };
};

module.exports = {
  addReaction,
  removeReaction,
  summarizeForMessages,
};
