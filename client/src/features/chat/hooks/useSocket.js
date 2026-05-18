import { useEffect } from 'react';
import { connectSocket, socket } from '../../../services/socket';
import { useAuthStore } from '../../auth/authStore';
import { useChatStore, useUiStore } from '../chatStore';

export const useSocket = ({ currentConversationKey, currentReceiver }) => {
  const {
    upsertContact,
    markContactOnline,
    appendMessage,
    setMessages,
    updateMessage,
    removeMessage,
    setContactUnread,
    touchContactLastMessage,
    upsertPin,
    removePin,
    upsertPoll,
  } = useChatStore();
  const { pushToast } = useUiStore();
  const currentUser = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    const registerPresence = () => {
      socket.emit('join-server');
      socket.emit('presence:refresh');
      if (currentUser?.id) {
        socket.emit('register', { userId: currentUser.id });
      }
    };

    if (accessToken && !socket.connected) {
      connectSocket(accessToken).then(registerPresence).catch(() => {});
    } else if (socket.connected) {
      registerPresence();
    }

    const handleUserJoin = (user) => {
      if (user.userId && currentUser?.id && user.userId === currentUser.id) {
        return;
      }

      upsertContact({
        userId: user.userId,
        name: user.name,
        displayName: user.username || user.name,
        target: user.username || user.phone || user.name,
        username: user.username,
        phone: user.phone,
        avatar: user.avatar,
        profileImage: user.profileImage,
        online: true,
        type: 'dm',
      });
    };

    const handleOnlineUsers = (users = []) => {
      users.forEach((user) => {
        if (user.userId && currentUser?.id && user.userId === currentUser.id) {
          return;
        }

        upsertContact({
          userId: user.userId,
          name: user.name,
          displayName: user.username || user.name,
          target: user.username || user.phone || user.name,
          username: user.username,
          phone: user.phone,
          avatar: user.avatar,
          profileImage: user.profileImage,
          online: true,
          type: 'dm',
        });
      });
    };

    const handleUserLeft = (user) => {
      markContactOnline({
        userId: user.userId,
        username: user.username,
        phone: user.phone,
        online: false,
      });
    };

    const handleReceiveMessage = (payload) => {
      const message = payload.message || payload;
      const receiverKey = message.chatId || currentConversationKey || message.receiver;
      const senderUser = payload.senderUser;

      if (senderUser && senderUser.id !== currentUser?.id) {
        upsertContact({
          userId: senderUser.id,
          name: senderUser.name,
          displayName: senderUser.username || senderUser.name || senderUser.phone,
          target: senderUser.username || senderUser.phone || senderUser.name,
          username: senderUser.username,
          phone: senderUser.phone,
          avatar: senderUser.avatar,
          profileImage: senderUser.profileImage || senderUser.avatar,
          chatId: message.chatId,
          online: true,
          type: 'dm',
        });
      }

      appendMessage(receiverKey, message);
      touchContactLastMessage({ currentUser, message });

      if (receiverKey !== currentConversationKey) {
        setContactUnread({ username: message.sender, chatId: message.chatId, increment: true });
        pushToast(`${message.sender} messaged you`, 'info', 'New message');
      }
    };

    const handleConversation = (messages) => {
      if (!currentConversationKey) {
        return;
      }
      setMessages(currentConversationKey, messages);
    };

    const handleMessagePinned = ({ message, chatId }) => {
      updateMessage(message.chatId || chatId, message._id, () => message);
      upsertPin(chatId, message);
    };

    const handleMessageUnpinned = ({ messageId, chatId }) => {
      updateMessage(chatId, messageId, (current) => ({ ...current, isPinned: false, pinnedBy: null }));
      removePin(chatId, messageId);
    };

    const handleReactionAdded = ({ messageId, emoji, userId, count }) => {
      useChatStore.setState((state) => {
        const conversationEntry = Object.entries(state.messagesByConversation).find(([, messages]) =>
          messages.some((message) => message._id === messageId)
        );

        if (!conversationEntry) {
          return state;
        }

        const [conversationKey, messages] = conversationEntry;
        const updateMessageReactions = (message) => {
          const reactions = message.reactions || [];
          const existing = reactions.find((entry) => entry.emoji === emoji);
          const nextReactions = existing
            ? reactions.map((entry) =>
                entry.emoji === emoji
                  ? { ...entry, count, reacted: userId === currentUser?.id ? true : entry.reacted || false }
                  : userId === currentUser?.id
                    ? { ...entry, reacted: false }
                    : entry
              )
            : [
                ...reactions.map((entry) =>
                  userId === currentUser?.id ? { ...entry, reacted: false } : entry
                ),
                { emoji, count, reacted: userId === currentUser?.id },
              ];

          return { ...message, reactions: nextReactions };
        };

        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationKey]: messages.map((message) =>
              message._id === messageId ? updateMessageReactions(message) : message
            ),
          },
        };
      });
    };

    const handleReactionRemoved = ({ messageId, emoji, userId, count }) => {
      useChatStore.setState((state) => {
        const conversationEntry = Object.entries(state.messagesByConversation).find(([, messages]) =>
          messages.some((message) => message._id === messageId)
        );

        if (!conversationEntry) {
          return state;
        }

        const [conversationKey, messages] = conversationEntry;
        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationKey]: messages.map((message) =>
              message._id === messageId
                ? {
                    ...message,
                    reactions: (message.reactions || [])
                      .map((entry) =>
                        entry.emoji === emoji
                          ? { ...entry, count, reacted: userId === currentUser?.id ? false : entry.reacted }
                          : entry
                      )
                      .filter((entry) => entry.count > 0),
                  }
                : message
            ),
          },
        };
      });
    };

    const handleMessageExpired = ({ messageId, chatId }) => {
      removeMessage(chatId, messageId);
    };

    const handleMessageDeleted = ({ messageId, chatId }) => {
      removeMessage(chatId, messageId);
      removePin(chatId, messageId);
    };

    const handleMessageRead = ({ chatId, readerId }) => {
      useChatStore.setState((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [chatId]: (state.messagesByConversation[chatId] || []).map((message) => ({
            ...message,
            readBy: (message.readBy || []).some((entry) => String(entry?._id || entry) === String(readerId))
              ? message.readBy
              : [...(message.readBy || []), readerId],
          })),
        },
      }));
    };

    const handlePollNew = (poll) => {
      upsertPoll(poll.chatId, poll);
    };

    const handlePollUpdated = ({ pollId, options }) => {
      useChatStore.setState((state) => {
        const pollsByChat = Object.fromEntries(
          Object.entries(state.pollsByChat).map(([chatId, polls]) => [
            chatId,
            polls.map((poll) => ((poll.id || poll._id) === pollId ? { ...poll, options } : poll)),
          ])
        );

        return { pollsByChat };
      });
    };

    socket.on('connect', registerPresence);
    socket.on('online-users', handleOnlineUsers);
    socket.on('new-user-join', handleUserJoin);
    socket.on('user:left', handleUserLeft);
    socket.on('receive-private-message', handleReceiveMessage);
    socket.on('send-conversation', handleConversation);
    socket.on('message:pinned', handleMessagePinned);
    socket.on('message:unpinned', handleMessageUnpinned);
    socket.on('reaction:added', handleReactionAdded);
    socket.on('reaction:removed', handleReactionRemoved);
    socket.on('message:expired', handleMessageExpired);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('message:read', handleMessageRead);
    socket.on('poll:new', handlePollNew);
    socket.on('poll:updated', handlePollUpdated);

    const refreshPresence = () => {
      if (socket.connected) {
        socket.emit('presence:refresh');
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshPresence();
      }
    };

    const refreshIntervalId = window.setInterval(refreshPresence, 15000);
    window.addEventListener('focus', refreshPresence);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      socket.off('connect', registerPresence);
      socket.off('online-users', handleOnlineUsers);
      socket.off('new-user-join', handleUserJoin);
      socket.off('user:left', handleUserLeft);
      socket.off('receive-private-message', handleReceiveMessage);
      socket.off('send-conversation', handleConversation);
      socket.off('message:pinned', handleMessagePinned);
      socket.off('message:unpinned', handleMessageUnpinned);
      socket.off('reaction:added', handleReactionAdded);
      socket.off('reaction:removed', handleReactionRemoved);
      socket.off('message:expired', handleMessageExpired);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('message:read', handleMessageRead);
      socket.off('poll:new', handlePollNew);
      socket.off('poll:updated', handlePollUpdated);
      window.clearInterval(refreshIntervalId);
      window.removeEventListener('focus', refreshPresence);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    appendMessage,
    accessToken,
    currentConversationKey,
    currentReceiver,
    currentUser?.id,
    markContactOnline,
    removeMessage,
    removePin,
    setContactUnread,
    setMessages,
    touchContactLastMessage,
    pushToast,
    updateMessage,
    upsertContact,
    upsertPin,
    upsertPoll,
  ]);
};
