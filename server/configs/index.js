const dotenv = require('dotenv');

dotenv.config();

const env = process.env;

const config = {
  NODE_ENV: env.NODE_ENV || 'development',
  PORT: Number(env.PORT) || 5000,
  MONGO_URL: env.MONGO_URL || env.MONGODB_URI,
  REDIS_URL: env.REDIS_URL || '',
  ACCESS_TOKEN_SECRET: env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: env.REFRESH_TOKEN_SECRET,
  COOKIE_SECRET: env.COOKIE_SECRET || env.REFRESH_TOKEN_SECRET,
  IMAGEKIT_PUBLIC_KEY: env.IMAGEKIT_PUBLIC_KEY,
  IMAGEKIT_PRIVATE_KEY: env.IMAGEKIT_PRIVATE_KEY,
  IMAGEKIT_URL_ENDPOINT: env.IMAGEKIT_URL_ENDPOINT,
  LIVEKIT_URL: env.LIVEKIT_URL || '',
  LIVEKIT_API_KEY: env.LIVEKIT_API_KEY || '',
  LIVEKIT_API_SECRET: env.LIVEKIT_API_SECRET || '',
  APP_DOMAIN: env.APP_DOMAIN || env.CLIENT_URL || 'http://localhost:5173',
  SMTP_HOST: env.SMTP_HOST || (env.EMAIL_USER ? 'smtp.gmail.com' : ''),
  SMTP_PORT: Number(env.SMTP_PORT) || 587,
  SMTP_USER: env.EMAIL_USER || env.SMTP_USER || '',
  SMTP_PASS: env.EMAIL__USER_PASSWORD || env.EMAIL_USER_PASSWORD || env.SMTP_PASS || '',
  SMTP_FROM: env.SMTP_FROM || (env.EMAIL_USER ? `Gatherly <${env.EMAIL_USER}>` : 'Gatherly <no-reply@gatherly.local>'),
  BODY_LIMIT: env.BODY_LIMIT || '1mb',
  CORS_ORIGINS: (env.CORS_ORIGINS || env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  ENABLE_CSP: env.ENABLE_CSP === 'true',
  TRUST_PROXY: env.TRUST_PROXY || 'loopback',
};

const requiredVars = ['MONGO_URL', 'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET'];

requiredVars.forEach((key) => {
  if (!config[key]) {
    throw new Error(
      `Missing required environment variable: ${key}. Please update your .env file before starting the server.`
    );
  }
});

['ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET'].forEach((key) => {
  if (config[key].length < 32) {
    throw new Error(`${key} must be at least 32 characters long.`);
  }
});

module.exports = config;
