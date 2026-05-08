const attachmentLabels = {
  audio: '🎤 Voice message',
  document: '📎 File',
  file: '📎 File',
  gif: 'GIF',
  image: '📷 Photo',
  video: '🎥 Video',
};

const firstName = (value = '') => String(value).trim().split(/\s+/)[0] || '';

export const getLastMessageContent = (message = {}) => {
  const type = message.type || message.contentType;
  const text = message.msg || message.content || message.message || '';

  if (type === 'text' && text) {
    return text;
  }

  if (attachmentLabels[type]) {
    return attachmentLabels[type];
  }

  const attachment = (message.attachments || [])[0];
  if (attachment?.type) {
    return attachmentLabels[attachment.type] || 'Message';
  }

  return text || 'Message';
};

export const isOwnLastMessage = (message = {}, currentUser = {}) => {
  const sender = message.sender || message.senderId || message.sessionId;
  const ownIds = [currentUser.id, currentUser._id, currentUser.username, currentUser.email].filter(Boolean).map(String);
  return ownIds.includes(String(sender));
};

export const getLastMessagePreview = ({ conversation = {}, currentUser = {}, message = {} }) => {
  const content = getLastMessageContent(message);

  if (isOwnLastMessage(message, currentUser)) {
    return `You: ${content}`;
  }

  if (conversation.type === 'group') {
    const senderName = firstName(message.senderName || message.name || message.sender || message.alias);
    return senderName ? `${senderName}: ${content}` : content;
  }

  return content;
};
