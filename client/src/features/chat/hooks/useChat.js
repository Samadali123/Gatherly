import { useEffect, useState } from 'react';
import api from '../../../services/api';
import { useAuthStore } from '../../auth/authStore';
import { useChatStore, useUiStore } from '../chatStore';
import { getConversationChatId } from '../utils/chat';

export const useChat = () => {
  const user = useAuthStore((state) => state.user);
  const {
    contacts,
    messagesByConversation,
    pinsByChat,
    pollsByChat,
    activeConversation,
    setActiveConversation,
    setContacts,
    setMessages,
    prependMessages,
    setContactUnread,
    touchContactLastMessage,
    appendMessage,
    updateMessage,
    removeMessage,
    setPins,
    upsertPin,
    removePin,
    upsertPoll,
    setSidebarOpen,
    setThreadData,
    setThreadOpen,
  } = useChatStore();
  const { pushToast } = useUiStore();
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [conversationPage, setConversationPage] = useState({ hasMore: false, nextCursor: null, key: null });
  const [sending, setSending] = useState(false);
  const [pollLoading, setPollLoading] = useState(false);
  const visibleContacts = contacts.filter(
    (contact) =>
      contact.userId !== user?.id &&
      contact.username !== user?.username &&
      contact.username !== user?.email
  );

const getConversationTarget = (conversation) =>
    conversation?.target || conversation?.username || conversation?.email || conversation?.name;

  const hasMessageId = (message) => Boolean(message?._id && message._id !== 'undefined' && message._id !== 'null');

  useEffect(() => {
    if (!user) {
      return;
    }

    api
      .get('/users/search')
      .then((response) => {
        setContacts(
          (response.data.data || []).map((contact) => ({
            ...contact,
            userId: contact.id || contact._id,
            displayName: contact.username || contact.name,
            target: contact.username || contact.email || contact.phone,
            type: 'dm',
          }))
        );
      })
      .catch((error) => pushToast(error.response?.data?.message || 'Unable to load users', 'error'));
  }, [pushToast, setContacts, user]);

  const loadPins = async (chatId) => {
    if (!chatId) {
      return;
    }

    try {
      const response = await api.get(`/chat/${chatId}/pins`);
      setPins(chatId, response.data.data || []);
    } catch (error) {
      pushToast(error.response?.data?.message || 'Unable to load pinned messages', 'error');
    }
  };

  const selectConversation = async (conversation) => {
    const chatId = getConversationChatId(conversation, user);
    const key = chatId || conversation?.username || conversation?.name;
    setActiveConversation({ ...conversation, key, chatId });
    setSidebarOpen(false);
    setLoadingConversation(true);

    try {
      const response = await api.get(`/chat/conversation?receiver=${encodeURIComponent(getConversationTarget(conversation))}&limit=30`);
      const payload = Array.isArray(response.data.data)
        ? { messages: response.data.data, hasMore: false, nextCursor: null }
        : response.data.data || { messages: [], hasMore: false, nextCursor: null };
      const loadedMessages = payload.messages || [];
      setMessages(key, loadedMessages);
      setConversationPage({ hasMore: Boolean(payload.hasMore), nextCursor: payload.nextCursor, key });
      if (loadedMessages.length) {
        touchContactLastMessage({ currentUser: user, message: loadedMessages[loadedMessages.length - 1] });
      }
      setContactUnread({ username: getConversationTarget(conversation), chatId, count: 0 });
      await api.post(`/chat/conversation/read?receiver=${encodeURIComponent(getConversationTarget(conversation))}`);
      await loadPins(chatId);
    } catch (error) {
      pushToast(error.response?.data?.message || 'Unable to load conversation', 'error');
    } finally {
      setLoadingConversation(false);
    }
  };

  const loadOlderMessages = async () => {
    if (!activeConversation || loadingOlder || !conversationPage.hasMore || !conversationPage.nextCursor) {
      return;
    }

    setLoadingOlder(true);
    try {
      const response = await api.get(
        `/chat/conversation?receiver=${encodeURIComponent(getConversationTarget(activeConversation))}&limit=30&before=${encodeURIComponent(conversationPage.nextCursor)}`
      );
      const payload = Array.isArray(response.data.data)
        ? { messages: response.data.data, hasMore: false, nextCursor: null }
        : response.data.data || { messages: [], hasMore: false, nextCursor: null };
      prependMessages(activeConversation.key, payload.messages || []);
      setConversationPage({ hasMore: Boolean(payload.hasMore), nextCursor: payload.nextCursor, key: activeConversation.key });
    } catch (error) {
      pushToast(error.response?.data?.message || 'Unable to load older messages', 'error');
    } finally {
      setLoadingOlder(false);
    }
  };

  const sendMessage = async (message, ttl = null, parentMessageId = null, attachments = []) => {
    if (!activeConversation) {
      return;
    }

    setSending(true);

    try {
      const response = await api.post('/messages', {
        receiver: getConversationTarget(activeConversation),
        message,
        ttl,
        parentMessageId,
        attachments,
      });

      appendMessage(activeConversation.key, response.data.data);
      touchContactLastMessage({ currentUser: user, message: response.data.data });
      return response.data.data;
    } catch (error) {
      pushToast(error.response?.data?.message || 'Unable to send message', 'error');
      throw error;
    } finally {
      setSending(false);
    }
  };

  const pinMessage = async (message) => {
    if (!hasMessageId(message)) {
      pushToast('Message is still syncing. Try again in a moment.', 'info');
      return;
    }

    try {
      const response = await api.post(`/messages/${message._id}/pin`);
      const updated = response.data.data;
      updateMessage(activeConversation.key, message._id, () => updated);
      upsertPin(activeConversation.chatId, updated);
    } catch (error) {
      pushToast(error.response?.data?.message || 'Unable to pin message', 'error');
    }
  };

  const unpinMessage = async (message) => {
    if (!hasMessageId(message)) {
      pushToast('Message is still syncing. Try again in a moment.', 'info');
      return;
    }

    try {
      await api.delete(`/messages/${message._id}/pin`);
      updateMessage(activeConversation.key, message._id, (current) => ({ ...current, isPinned: false, pinnedBy: null }));
      removePin(activeConversation.chatId, message._id);
    } catch (error) {
      pushToast(error.response?.data?.message || 'Unable to unpin message', 'error');
    }
  };

  const deleteMessage = async (message) => {
    if (!hasMessageId(message)) {
      pushToast('Message is still syncing. Try again in a moment.', 'info');
      return;
    }

    try {
      await api.delete(`/messages/${message._id}`);
      removeMessage(activeConversation.key, message._id);
      removePin(activeConversation.chatId, message._id);
    } catch (error) {
      pushToast(error.response?.data?.message || 'Unable to delete message', 'error');
    }
  };

  const clearConversation = async () => {
    if (!activeConversation) {
      return;
    }

    try {
      await api.delete(`/chat/conversation?receiver=${encodeURIComponent(getConversationTarget(activeConversation))}`);
      setMessages(activeConversation.key, []);
      setPins(activeConversation.chatId, []);
      pushToast('Chat history cleared', 'success');
    } catch (error) {
      pushToast(error.response?.data?.message || 'Unable to clear chat history', 'error');
    }
  };

  const fetchThread = async (message) => {
    if (!hasMessageId(message)) {
      pushToast('Message is still syncing. Try again in a moment.', 'info');
      return;
    }

    try {
      const response = await api.get(`/messages/${message._id}/thread`);
      setThreadData({
        parent: response.data.data.parent,
        replies: response.data.data.replies || [],
      });
      setThreadOpen(true);
    } catch (error) {
      pushToast(error.response?.data?.message || 'Unable to load thread', 'error');
    }
  };

  const sendThreadReply = async (content, attachments = []) => {
    const state = useChatStore.getState();

    if (!state.threadParent) {
      return;
    }

    const reply = await sendMessage(content, null, state.threadParent._id, attachments);
    setThreadData({
      parent: state.threadParent,
      replies: [...state.threadMessages, reply],
    });
  };

  const uploadAttachments = async ({ type, files }) => {
    const formData = new FormData();
    formData.append('type', type);
    files.forEach((file) => formData.append('files', file));

    try {
      const response = await api.post('/messages/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data || [];
    } catch (error) {
      pushToast(error.response?.data?.message || 'Unable to upload attachment', 'error');
      throw error;
    }
  };

  const addReaction = async (message, emoji) => {
    if (!hasMessageId(message)) {
      pushToast('Message is still syncing. Try again in a moment.', 'info');
      return;
    }

    try {
      const existingMyReaction = (message.reactions || []).find((entry) => entry.reacted);

      await api.post(`/messages/${message._id}/reactions`, { emoji });
      updateMessage(activeConversation.key, message._id, (current) => {
        const reactions = current.reactions || [];
        const reactionsWithoutMyPrevious = reactions
          .map((entry) =>
            entry.reacted && entry.emoji !== emoji
              ? { ...entry, count: Math.max(0, entry.count - 1), reacted: false }
              : { ...entry, reacted: false }
          )
          .filter((entry) => entry.count > 0);
        const existing = reactionsWithoutMyPrevious.find((entry) => entry.emoji === emoji);
        const nextReactions = existing
          ? reactionsWithoutMyPrevious.map((entry) =>
              entry.emoji === emoji
                ? { ...entry, count: existingMyReaction?.emoji === emoji ? entry.count : entry.count + 1, reacted: true }
                : entry
            )
          : [...reactionsWithoutMyPrevious, { emoji, count: 1, reacted: true }];

        return { ...current, reactions: nextReactions };
      });
    } catch (error) {
      pushToast(error.response?.data?.message || 'Unable to add reaction', 'error');
    }
  };

  const removeReactionFromMessage = async (message, emoji) => {
    if (!hasMessageId(message)) {
      pushToast('Message is still syncing. Try again in a moment.', 'info');
      return;
    }

    try {
      await api.delete(`/messages/${message._id}/reactions/${encodeURIComponent(emoji)}`);
      updateMessage(activeConversation.key, message._id, (current) => ({
        ...current,
        reactions: (current.reactions || [])
          .map((entry) => (entry.emoji === emoji ? { ...entry, count: Math.max(0, entry.count - 1), reacted: false } : entry))
          .filter((entry) => entry.count > 0),
      }));
    } catch (error) {
      pushToast(error.response?.data?.message || 'Unable to remove reaction', 'error');
    }
  };

  const toggleReaction = async (message, emoji) => {
    const existing = (message.reactions || []).find((entry) => entry.emoji === emoji);

    if (existing?.reacted) {
      await removeReactionFromMessage(message, emoji);
      return;
    }

    await addReaction(message, emoji);
  };

  const createPoll = async (payload) => {
    if (!activeConversation?.chatId || activeConversation.type !== 'group') {
      return;
    }

    setPollLoading(true);
    try {
      const response = await api.post('/polls', {
        ...payload,
        chatId: activeConversation.chatId,
      });
      upsertPoll(activeConversation.chatId, response.data.data);
    } catch (error) {
      pushToast(error.response?.data?.message || 'Unable to create poll', 'error');
      throw error;
    } finally {
      setPollLoading(false);
    }
  };

  const votePoll = async (pollId, optionId) => {
    try {
      const response = await api.post(`/polls/${pollId}/vote`, { optionId });
      upsertPoll(activeConversation.chatId, response.data.data);
    } catch (error) {
      pushToast(error.response?.data?.message || 'Unable to vote on poll', 'error');
    }
  };

  return {
    contacts: visibleContacts,
    activeConversation,
    messages: activeConversation ? messagesByConversation[activeConversation.key] || [] : [],
    pins: activeConversation ? pinsByChat[activeConversation.chatId] || [] : [],
    polls: activeConversation ? pollsByChat[activeConversation.chatId] || [] : [],
    loadingConversation,
    loadingOlder,
    hasOlderMessages: conversationPage.key === activeConversation?.key && conversationPage.hasMore,
    sending,
    pollLoading,
    selectConversation,
    sendMessage,
    loadOlderMessages,
    pinMessage,
    unpinMessage,
    deleteMessage,
    clearConversation,
    fetchThread,
    sendThreadReply,
    uploadAttachments,
    addReaction,
    toggleReaction,
    createPoll,
    votePoll,
  };
};
