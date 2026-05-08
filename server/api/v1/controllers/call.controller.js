const callService = require('../../../services/callService');
const { sendSuccess } = require('../../../utils/response');

const listCallLogs = async (req, res, next) => {
  try {
    const logs = await callService.listForUser(req.user.userId);
    return sendSuccess(res, logs, 'Call logs fetched');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listCallLogs,
};
