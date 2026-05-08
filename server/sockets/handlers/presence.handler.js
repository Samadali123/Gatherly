const userService = require('../../services/userService');
const logger = require('../../utils/logger');

const registerPresenceHandlers = (io, socket) => {
  socket.on('join-server', async () => {
    try {
      await userService.updateSocketId(socket.user.userId, socket.id);

      const currentUser = await userService.findById(socket.user.userId);

      if (!currentUser) {
        return;
      }

      const onlineUsers = await userService.listOnlineUsers();
      onlineUsers
        .filter((onlineUser) => onlineUser.socketId !== socket.id)
        .forEach((onlineUser) => {
          socket.emit('new-user-join', {
            userId: onlineUser._id.toString(),
            name: onlineUser.name,
            username: onlineUser.username || onlineUser.email,
            profileImage: onlineUser.profileImage,
          });
        });

      socket.broadcast.emit('new-user-join', {
        userId: currentUser._id.toString(),
        name: currentUser.name,
        username: currentUser.username || currentUser.email,
        profileImage: currentUser.profileImage,
      });
    } catch (error) {
      logger.error(`join-server failed: ${error.message}`);
    }
  });

  socket.on('disconnect', async () => {
    try {
      const disconnectedUser = await userService.clearSocketById(socket.id);

      if (disconnectedUser) {
        socket.broadcast.emit('user:left', {
          userId: disconnectedUser._id.toString(),
          username: disconnectedUser.username || disconnectedUser.email,
        });
      }
    } catch (error) {
      logger.error(`disconnect cleanup failed: ${error.message}`);
    }
  });
};

module.exports = registerPresenceHandlers;
