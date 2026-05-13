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

const followUser = (followerId, followingId) =>
  prisma.follow.upsert({
    where: { followerId_followingId: { followerId, followingId } },
    update: {},
    create: { followerId, followingId },
  });

const unfollowUser = async (followerId, followingId) => {
  await prisma.follow.deleteMany({ where: { followerId, followingId } });
};

const blockUser = async (blockerId, blockedId) => {
  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    update: {},
    create: { blockerId, blockedId },
  });
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
