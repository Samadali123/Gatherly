const groupService = require('../../../services/groupService');
const userService = require('../../../services/userService');
const { sendError, sendSuccess } = require('../../../utils/response');

const createGroup = async (req, res, next) => {
  try {
    const currentUser = await userService.findById(req.user.userId);

    if (!currentUser) {
      return sendError(res, 'User not found', 404);
    }

    const group = await groupService.createGroup({
      groupName: req.body.groupName,
      userId: currentUser._id,
    });

    return sendSuccess(res, group, 'Group created', 201);
  } catch (error) {
    return next(error);
  }
};

const joinGroup = async (req, res, next) => {
  try {
    const group = await groupService.findByName(req.body.groupName);

    if (!group) {
      return sendError(res, 'Group not found', 404);
    }

    const currentUser = await userService.findById(req.user.userId);

    if (!currentUser) {
      return sendError(res, 'User not found', 404);
    }

    const updatedGroup = await groupService.addUserToGroup({
      group,
      userId: currentUser._id,
    });

    return sendSuccess(res, updatedGroup, 'Group joined');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createGroup,
  joinGroup,
};
