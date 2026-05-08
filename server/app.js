const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const createError = require('http-errors');
const apiRoutes = require('./api/v1/routes');
const config = require('./configs');
const swaggerRouter = require('./docs/swagger');
const errorHandler = require('./api/v1/middlewares/error.middleware');
const { createRateLimiter } = require('./api/v1/middlewares/rateLimit.middleware');
const {
  compressionMiddleware,
  corsMiddleware,
  helmetMiddleware,
} = require('./api/v1/middlewares/security.middleware');
const logger = require('./utils/logger');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', config.TRUST_PROXY);
app.set('views', path.resolve(__dirname, '../views'));
app.set('view engine', 'ejs');

app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(compressionMiddleware);
app.use(
  morgan('dev', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

app.use(createRateLimiter({ max: 500, windowMs: 15 * 60 * 1000 }));
app.use(express.json({ limit: config.BODY_LIMIT }));
app.use(express.urlencoded({ extended: false, limit: config.BODY_LIMIT, parameterLimit: 100 }));
app.use(cookieParser(config.COOKIE_SECRET));
app.use(express.static(path.resolve(__dirname, 'public')));

app.use('/api-docs', swaggerRouter);
app.use('/api/v1', apiRoutes);

app.all('*', (req, res, next) => {
  next(createError(404, 'Resource not found'));
});

app.use(errorHandler);

module.exports = app;
