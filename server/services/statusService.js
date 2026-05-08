const statusModel = require('../models/status.model');
const messageModel = require('../models/message.model');
const userModel = require('../models/user.model');

const createStatus = ({ userId, type, text = '', mediaUrl = '', style = {} }) =>
  statusModel.create({
    userId,
    type,
    text,
    mediaUrl,
    style,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

const populateStatusQuery = (query) =>
  query
    .sort({ createdAt: -1 })
    .populate('userId', 'name username avatar profileImage')
    .populate('replies.userId', 'name username avatar profileImage')
    .populate('reactions.userId', 'name username avatar profileImage');

const listForUser = async (currentUser) => {
  const mine = await populateStatusQuery(
    statusModel.find({ userId: currentUser._id, expiresAt: { $gt: new Date() } })
  );

  const messages = await messageModel
    .find({
      $or: [{ sender: currentUser.username }, { receiver: currentUser.username }],
    })
    .select('sender receiver');

  const connectedUsernames = new Set();
  messages.forEach((message) => {
    if (message.sender && message.sender !== currentUser.username) {
      connectedUsernames.add(message.sender);
    }

    if (message.receiver && message.receiver !== currentUser.username) {
      connectedUsernames.add(message.receiver);
    }
  });

  const connectedUsers = connectedUsernames.size
    ? await userModel.find({ username: { $in: Array.from(connectedUsernames) } }).select('_id')
    : [];

  const updates = connectedUsers.length
    ? await populateStatusQuery(
        statusModel.find({
          userId: { $in: connectedUsers.map((user) => user._id) },
          expiresAt: { $gt: new Date() },
        })
      )
    : [];

  return { mine, updates };
};

const findStatusById = (id) => statusModel.findById(id).populate('userId', 'name username avatar profileImage');

const addReply = async ({ statusId, userId, text }) =>
  statusModel.findByIdAndUpdate(
    statusId,
    { $push: { replies: { userId, text } } },
    { new: true }
  );

const react = async ({ statusId, userId, emoji }) => {
  const status = await statusModel.findById(statusId);

  if (!status) {
    return null;
  }

  status.reactions = (status.reactions || []).filter((reaction) => reaction.userId.toString() !== userId);
  status.reactions.push({ userId, emoji });
  await status.save();
  return status;
};

module.exports = {
  createStatus,
  listForUser,
  findStatusById,
  addReply,
  react,
};
