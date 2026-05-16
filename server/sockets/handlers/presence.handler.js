const userService = require('../../services/userService');
const logger = require('../../utils/logger');
const { hasConnectedSocket } = require('../state');

const buildPresenceUser = (user) => ({
  userId: user._id.toString(),
  name: user.name,
  username: user.username || user.phone || user.name,
  phone: user.phone || '',
  avatar: user.avatar || user.profileImage,
  profileImage: user.profileImage || user.avatar,
});

const emitOnlineSnapshot = async (socket) => {
  const onlineUsers = await userService.listOnlineUsers();
  socket.emit(
    'online-users',
    onlineUsers
      .filter((onlineUser) => onlineUser.socketId !== socket.id && hasConnectedSocket(onlineUser.socketId))
      .map(buildPresenceUser)
  );
};

const registerPresenceHandlers = (io, socket) => {
  socket.on('join-server', async () => {
    try {
      await userService.updateSocketId(socket.user.userId, socket.id);

      const currentUser = await userService.findById(socket.user.userId);

      if (!currentUser) {
        return;
      }

      await emitOnlineSnapshot(socket);
      socket.broadcast.emit('new-user-join', buildPresenceUser(currentUser));
    } catch (error) {
      logger.error(`join-server failed: ${error.message}`);
    }
  });

  socket.on('presence:refresh', async () => {
    try {
      await emitOnlineSnapshot(socket);
    } catch (error) {
      logger.error(`presence refresh failed: ${error.message}`);
    }
  });

  socket.on('disconnect', async () => {
    try {
      const disconnectedUser = await userService.clearSocketById(socket.id);

      if (disconnectedUser) {
        socket.broadcast.emit('user:left', {
          userId: disconnectedUser._id.toString(),
          username: disconnectedUser.username || disconnectedUser.phone || disconnectedUser.name,
          phone: disconnectedUser.phone || '',
        });
      }
    } catch (error) {
      logger.error(`disconnect cleanup failed: ${error.message}`);
    }
  });
};

module.exports = registerPresenceHandlers;
