let ioInstance = null;

const setIO = (io) => {
  ioInstance = io;
};

const getIO = () => ioInstance;

const hasConnectedSocket = (socketId) => {
  if (!ioInstance || !socketId) {
    return false;
  }

  return ioInstance.sockets.sockets.has(socketId);
};

module.exports = {
  setIO,
  getIO,
  hasConnectedSocket,
};
