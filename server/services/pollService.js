const { nanoid } = require('nanoid');
const pollModel = require('../models/poll.model');

const createPoll = async ({ question, options, chatId, createdBy, expiresAt, isAnonymous }) =>
  pollModel.create({
    question,
    options: options.map((text) => ({ id: nanoid(10), text, votes: [] })),
    chatId,
    createdBy,
    expiresAt,
    isAnonymous,
  });

const findById = (id) => pollModel.findById(id);

const vote = async ({ poll, optionId, userId }) => {
  const option = poll.options.find((entry) => entry.id === optionId);

  if (!option) {
    const error = new Error('Invalid option');
    error.statusCode = 400;
    throw error;
  }

  if (option.votes.some((voteUserId) => voteUserId.toString() === userId.toString())) {
    const error = new Error('Already voted on this poll');
    error.statusCode = 409;
    throw error;
  }

  poll.options.forEach((entry) => {
    entry.votes = entry.votes.filter((voteUserId) => voteUserId.toString() !== userId.toString());
  });

  option.votes.push(userId);

  if (poll.expiresAt && poll.expiresAt <= new Date()) {
    poll.isActive = false;
  }

  await poll.save();
  return poll;
};

const serializePoll = (poll) => ({
  id: poll._id,
  question: poll.question,
  chatId: poll.chatId,
  createdBy: poll.createdBy,
  expiresAt: poll.expiresAt,
  isAnonymous: poll.isAnonymous,
  isActive: poll.isActive,
  options: poll.options.map((option) => ({
    id: option.id,
    text: option.text,
    voteCount: option.votes.length,
    votes: poll.isAnonymous ? undefined : option.votes,
  })),
});

module.exports = {
  createPoll,
  findById,
  vote,
  serializePoll,
};
