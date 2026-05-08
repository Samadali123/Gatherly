const groupModel = require('../models/group.model');

const findByName = (name) => groupModel.findOne({ name });
const findById = (id) => groupModel.findById(id);

const listForUser = (userId) =>
  groupModel.find({
    users: {
      $in: [userId],
    },
  });

const createGroup = ({ groupName, userId }) =>
  groupModel.create({
    name: groupName,
    users: [userId],
  });

const addUserToGroup = async ({ group, userId }) => {
  if (!group.users.some((memberId) => memberId.toString() === userId.toString())) {
    group.users.push(userId);
  }

  await group.save();
  return group;
};

const isUserInGroup = async (groupName, userId) => {
  const group = await findByName(groupName);

  if (!group) {
    return false;
  }

  return group.users.some((memberId) => memberId.toString() === userId.toString());
};

module.exports = {
  findByName,
  findById,
  listForUser,
  createGroup,
  addUserToGroup,
  isUserInGroup,
};
