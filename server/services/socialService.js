const prisma = require('../configs/prisma');

const getRelationship = async ({ viewerId, targetId }) => {
  if (!viewerId || !targetId || viewerId === targetId) {
    return {
      isSelf: viewerId === targetId,
      following: false,
      followedBy: false,
      blockedByMe: false,
      blockedMe: false,
    };
  }

  const [following, followedBy, blockedByMe, blockedMe] = await Promise.all([
    prisma.follow.findFirst({ where: { followerId: viewerId, followingId: targetId } }),
    prisma.follow.findFirst({ where: { followerId: targetId, followingId: viewerId } }),
    prisma.block.findFirst({ where: { blockerId: viewerId, blockedId: targetId } }),
    prisma.block.findFirst({ where: { blockerId: targetId, blockedId: viewerId } }),
  ]);

  return {
    isSelf: false,
    following: Boolean(following),
    followedBy: Boolean(followedBy),
    blockedByMe: Boolean(blockedByMe),
    blockedMe: Boolean(blockedMe),
  };
};

const countForUser = async (userId) => {
  const [followers, following] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);
  return { followers, following };
};

const followUser = async (followerId, followingId) => {
  try {
    return await prisma.follow.create({
      data: { followerId, followingId },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return prisma.follow.findFirst({ where: { followerId, followingId } });
    }
    throw error;
  }
};

const unfollowUser = async (followerId, followingId) => {
  await prisma.follow.deleteMany({ where: { followerId, followingId } });
};

const blockUser = async (blockerId, blockedId) => {
  try {
    await prisma.block.create({
      data: { blockerId, blockedId },
    });
  } catch (error) {
    if (error.code !== 'P2002') {
      throw error;
    }
  }
  await prisma.follow.deleteMany({
    where: {
      OR: [
        { followerId: blockerId, followingId: blockedId },
        { followerId: blockedId, followingId: blockerId },
      ],
    },
  });
};

const unblockUser = async (blockerId, blockedId) => {
  await prisma.block.deleteMany({ where: { blockerId, blockedId } });
};

const getBlockBetween = async (leftId, rightId) =>
  prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: leftId, blockedId: rightId },
        { blockerId: rightId, blockedId: leftId },
      ],
    },
  });

module.exports = {
  blockUser,
  countForUser,
  followUser,
  getBlockBetween,
  getRelationship,
  unblockUser,
  unfollowUser,
};
