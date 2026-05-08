const http = require('http');
const app = require('./app');
const config = require('./configs');
const connectDB = require('./configs/db');
const initializeSockets = require('./sockets');
const logger = require('./utils/logger');
const userService = require('./services/userService');
const startExpireMessagesJob = require('./jobs/expireMessages.job');
const startExpireRoomsJob = require('./jobs/expireRooms.job');

const startServer = async () => {
  await connectDB();
  await userService.clearAllSocketIds();

  const server = http.createServer(app);
  server.headersTimeout = 65000;
  server.requestTimeout = 60000;
  server.keepAliveTimeout = 5000;
  initializeSockets(server);
  startExpireMessagesJob();
  startExpireRoomsJob();

  server.listen(config.PORT, () => {
    logger.info(`Server listening on port ${config.PORT}`);
  });

  server.on('error', (error) => {
    logger.error(`Server error: ${error.message}`);
    process.exit(1);
  });

  return server;
};

if (require.main === module) {
  startServer().catch((error) => {
    logger.error(`Startup failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = startServer;
