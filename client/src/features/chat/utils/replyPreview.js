const previewLimit = 100;

const firstAttachment = (message) => (message?.attachments || []).find((attachment) => attachment?.type !== 'sticker');

export const buildReplyToPreview = ({ message }) => {
  if (!message) {
    return null;
  }

  const attachment = firstAttachment(message);
  const isImage = attachment?.type === 'image';
  const isFile = attachment && !isImage;
  const text = String(message.msg || message.content || '').trim();

  return {
    messageId: String(message._id || message.id || ''),
    senderId: String(message.senderId || message.sender || message.sessionId || ''),
    senderName: String(message.senderName || message.alias || message.sender || 'Unknown'),
    contentPreview: isImage ? 'Photo' : isFile ? 'File' : text.slice(0, previewLimit),
    contentType: isImage ? 'image' : isFile ? 'file' : 'text',
    mediaUrl: isImage ? attachment.url || '' : '',
  };
};
