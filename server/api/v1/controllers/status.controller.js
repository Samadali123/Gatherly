const statusService = require('../../../services/statusService');
const uploadService = require('../../../services/uploadService');
const chatService = require('../../../services/chatService');
const userService = require('../../../services/userService');
const { emitToUser } = require('../../../sockets/emitter');
const { sendError, sendSuccess } = require('../../../utils/response');

const listStatuses = async (req, res, next) => {
  try {
    const currentUser = await userService.findById(req.user.userId);

    if (!currentUser) {
      return sendError(res, 'User not found', 404);
    }

    const statuses = await statusService.listForUser(currentUser);
    return sendSuccess(res, statuses, 'Statuses fetched');
  } catch (error) {
    return next(error);
  }
};

const createStatusMessage = async ({ req, status, text }) => {
  const senderUser = await userService.findById(req.user.userId);
  const owner = status.userId;

  if (!senderUser || !owner?.username) {
    return null;
  }

  if (owner._id.toString() === senderUser._id.toString()) {
    const error = new Error('You cannot reply to your own status');
    error.statusCode = 400;
    throw error;
  }

  const { message } = await chatService.createMessage({
    message: text,
    senderUser,
    receiver: owner.username,
    statusContext: {
      statusId: status._id,
      type: status.type,
      text: status.text,
      mediaUrl: status.mediaUrl,
    },
  });

  await emitToUser(owner._id, 'receive-private-message', {
    messageId: message._id,
    chatId: message.chatId,
    message,
  }, senderUser._id);

  return message;
};

const createStatus = async (req, res, next) => {
  try {
    if ((req.body.type === 'image' || req.body.type === 'video') && !req.body.mediaUrl) {
      return sendError(res, 'Media is required for this status', 400);
    }

    if (req.body.type === 'text' && !req.body.text?.trim()) {
      return sendError(res, 'Text is required for status', 400);
    }

    const status = await statusService.createStatus({
      userId: req.user.userId,
      type: req.body.type,
      text: req.body.text,
      mediaUrl: req.body.mediaUrl,
      style: req.body.style,
    });

    return sendSuccess(res, status, 'Status created', 201);
  } catch (error) {
    return next(error);
  }
};

const uploadStatusMedia = async (req, res, next) => {
  try {
    if (!['image', 'video'].includes(req.body.type)) {
      return sendError(res, 'Only image and video statuses are supported', 400);
    }

    const attachments = await uploadService.uploadAttachments({
      files: req.files || [],
      type: req.body.type,
      folder: `gatherly/statuses/${req.user.userId}`,
    });

    return sendSuccess(res, attachments[0], 'Status media uploaded', 201);
  } catch (error) {
    return next(error);
  }
};

const replyToStatus = async (req, res, next) => {
  try {
    if (!req.body.text?.trim()) {
      return sendError(res, 'Reply text is required', 400);
    }

    const status = await statusService.findStatusById(req.params.id);

    if (!status) {
      return sendError(res, 'Status not found', 404);
    }

    const updated = await statusService.addReply({
      statusId: req.params.id,
      userId: req.user.userId,
      text: req.body.text.trim(),
    });

    await createStatusMessage({ req, status, text: req.body.text.trim() });

    return sendSuccess(res, updated, 'Reply sent');
  } catch (error) {
    return next(error);
  }
};

const reactToStatus = async (req, res, next) => {
  try {
    const status = await statusService.findStatusById(req.params.id);

    if (!status) {
      return sendError(res, 'Status not found', 404);
    }

    const updated = await statusService.react({
      statusId: req.params.id,
      userId: req.user.userId,
      emoji: req.body.emoji,
    });

    await createStatusMessage({ req, status, text: req.body.emoji });

    return sendSuccess(res, updated, 'Reaction sent');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listStatuses,
  createStatus,
  uploadStatusMedia,
  replyToStatus,
  reactToStatus,
};
