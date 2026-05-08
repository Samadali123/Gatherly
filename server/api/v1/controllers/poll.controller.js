const pollService = require('../../../services/pollService');
const { emitToChatMembers } = require('../../../sockets/emitter');
const { sendError, sendSuccess } = require('../../../utils/response');

const createPoll = async (req, res, next) => {
  try {
    const poll = await pollService.createPoll({
      ...req.body,
      createdBy: req.user.userId,
    });

    await emitToChatMembers(poll.chatId, 'poll:new', pollService.serializePoll(poll), req.user.userId);

    return sendSuccess(res, pollService.serializePoll(poll), 'Poll created', 201);
  } catch (error) {
    return next(error);
  }
};

const votePoll = async (req, res, next) => {
  try {
    const poll = await pollService.findById(req.params.id);

    if (!poll) {
      return sendError(res, 'Poll not found', 404);
    }

    const updated = await pollService.vote({
      poll,
      optionId: req.body.optionId,
      userId: req.user.userId,
    });

    const serialized = pollService.serializePoll(updated);
    await emitToChatMembers(updated.chatId, 'poll:updated', {
      pollId: updated._id,
      options: serialized.options,
    }, req.user.userId);

    return sendSuccess(res, serialized, 'Poll updated');
  } catch (error) {
    return next(error);
  }
};

const getPoll = async (req, res, next) => {
  try {
    const poll = await pollService.findById(req.params.id);

    if (!poll) {
      return sendError(res, 'Poll not found', 404);
    }

    return sendSuccess(res, pollService.serializePoll(poll), 'Poll fetched');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPoll,
  votePoll,
  getPoll,
};
