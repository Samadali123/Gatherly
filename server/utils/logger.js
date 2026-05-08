const fs = require('fs');
const path = require('path');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const config = require('../configs');

const logsDir = path.resolve(__dirname, '../logs');

if (config.NODE_ENV === 'production' && !fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`)
);

const jsonFormat = winston.format.combine(winston.format.timestamp(), winston.format.json());

const transports =
  config.NODE_ENV === 'production'
    ? [
        new DailyRotateFile({
          filename: path.join(logsDir, 'application-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxFiles: '14d',
          zippedArchive: true,
        }),
      ]
    : [new winston.transports.Console()];

const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  format: config.NODE_ENV === 'production' ? jsonFormat : consoleFormat,
  transports,
});

module.exports = logger;
