export const buildDirectChatId = (left, right) => ['dm', left, right].sort().join(':');

export const getConversationChatId = (conversation, currentUser) => {
  if (!conversation) {
    return null;
  }

  if (conversation.type === 'group') {
    return conversation._id || conversation.chatId || null;
  }

  const receiver = conversation.username || conversation.email || conversation.name;
  const sender = currentUser?.username || currentUser?.email;

  if (!receiver || !sender) {
    return conversation.chatId || null;
  }

  return buildDirectChatId(sender, receiver);
};
