const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const config = require('../../../configs');

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  return config.CORS_ORIGINS.includes(origin);
};

const corsMiddleware = cors({
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
});

const helmetMiddleware = helmet({
  contentSecurityPolicy: config.ENABLE_CSP
    ? {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", ...config.CORS_ORIGINS, 'wss:', 'https:'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          mediaSrc: ["'self'", 'blob:', 'https:'],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      }
    : false,
  crossOriginEmbedderPolicy: false,
});

module.exports = {
  compressionMiddleware: compression(),
  corsMiddleware,
  helmetMiddleware,
  isAllowedOrigin,
};
