const { customAlphabet } = require('nanoid');
const callModel = require('../models/call.model');

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);

const createCall = ({ callerId = null, receiverId = null, roomId = null, status = 'calling', type = 'one-to-one' }) =>
  callModel.create({
    callId: `call_${nanoid()}`,
    callerId,
    receiverId,
    roomId: roomId || `call-room-${nanoid()}`,
    status,
    type,
  });

const markRinging = (callId) =>
  callModel.findOneAndUpdate({ callId }, { status: 'ringing' }, { new: true });

const markConnected = (callId) =>
  callModel.findOneAndUpdate(
    { callId },
    {
      connectedAt: new Date(),
      status: 'connected',
    },
    { new: true }
  );

const finishCall = async (callId, status = 'ended') => {
  const call = await callModel.findOne({ callId });

  if (!call) {
    return null;
  }

  const endedAt = new Date();
  const duration = call.connectedAt ? Math.max(0, Math.floor((endedAt.getTime() - call.connectedAt.getTime()) / 1000)) : 0;

  call.status = status;
  call.endedAt = endedAt;
  call.duration = duration;
  await call.save();
  return call;
};

const listForUser = (userId, limit = 40) =>
  callModel
    .find({
      $or: [{ callerId: userId }, { receiverId: userId }],
    })
    .populate('callerId receiverId', 'name username email avatar profileImage')
    .sort({ createdAt: -1 })
    .limit(limit);

module.exports = {
  createCall,
  finishCall,
  listForUser,
  markConnected,
  markRinging,
};
