const nodemailer = require('nodemailer');
const config = require('../configs');
const logger = require('../utils/logger');

let transporter = null;

const getTransporter = () => {
  if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });
  }

  return transporter;
};

const sendMail = async ({ to, subject, text, html }) => {
  const mailer = getTransporter();

  if (!mailer) {
    logger.warn(`Email delivery is not configured. Password reset email for ${to}: ${text}`);
    return { skipped: true };
  }

  return mailer.sendMail({
    from: config.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
};

module.exports = {
  sendMail,
};
