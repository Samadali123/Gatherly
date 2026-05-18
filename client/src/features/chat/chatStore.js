import { create } from 'zustand';
import { getLastMessagePreview } from './utils/lastMessagePreview';

const getMessageTime = (message = {}) =>
  new Date(message.createdAt || message.updatedAt || Date.now()).getTime();

const sortByLastMessage = (items) =>
  [...items].sort((left, right) => (right.lastMessageAt || 0) - (left.lastMessageAt || 0));

const contactIdentity = (contact = {}) =>
  String(contact.userId || contact.id || contact._id || contact.username || contact.phone || contact.target || contact.name || '')
    .trim()
    .toLowerCase();

const dedupeContacts = (contacts = []) => {
  const byIdentity = new Map();

  contacts.forEach((contact) => {
    const identity = contactIdentity(contact);
    if (!identity) {
      return;
    }

    const existing = byIdentity.get(identity);
    byIdentity.set(identity, existing ? { ...existing, ...contact } : contact);
  });

  return sortByLastMessage([...byIdentity.values()]);
};

const messageIdentity = (message = {}) =>
  String(message._id || message.id || message.clientId || '')
    .trim()
    .toLowerCase();

const messageMatchesContact = (message, contact) => {
  const participants = [message.sender, message.receiver].filter(Boolean);
  return (
    contact.chatId === message.chatId ||
    participants.includes(contact.username) ||
    participants.includes(contact.target) ||
    participants.includes(contact.phone) ||
    participants.includes(contact.email) ||
    participants.includes(contact.name)
  );
};

const sameContact = (entry, contact = {}) =>
  Boolean(
    (entry.userId && contact.userId && entry.userId === contact.userId) ||
      (entry.username && contact.username && entry.username === contact.username) ||
      (entry.phone && contact.phone && entry.phone === contact.phone) ||
      (entry.target && contact.target && entry.target === contact.target)
  );

const buildToast = (message, variant = 'info', title = '') => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  message,
  variant,
  title,
});

export const useChatStore = create((set) => ({
  contacts: [],
  groups: [],
  messagesByConversation: {},
  pinsByChat: {},
  pollsByChat: {},
  activeConversation: null,
  isSidebarOpen: false,
  pinsOpen: false,
  threadOpen: false,
  threadParent: null,
  threadMessages: [],
  setContacts: (contacts) =>
    set((state) => {
      const mergedContacts = contacts.map((contact) => {
        const existing = state.contacts.find((entry) => sameContact(entry, contact));
        return existing
          ? {
              ...existing,
              ...contact,
              online: contact.online ?? existing.online,
              unreadCount: contact.unreadCount ?? existing.unreadCount,
              lastMessageAt: contact.lastMessageAt ?? existing.lastMessageAt,
              lastMessagePreview: contact.lastMessagePreview ?? existing.lastMessagePreview,
            }
          : contact;
      });

      const retainedContacts = state.contacts.filter(
        (entry) =>
          !mergedContacts.some((contact) => sameContact(entry, contact)) &&
          (entry.online || entry.lastMessageAt || entry.lastMessagePreview)
      );

      return { contacts: sortByLastMessage([...mergedContacts, ...retainedContacts]) };
    }),
  upsertContact: (contact) =>
    set((state) => {
      const existing = state.contacts.find((entry) => sameContact(entry, contact));
      const contacts = existing
        ? state.contacts.map((entry) =>
            sameContact(entry, contact) ? { ...entry, ...contact } : entry
          )
        : [...state.contacts, contact];
      return { contacts };
    }),
  markContactOnline: ({ userId, username, phone, online }) =>
    set((state) => ({
      contacts: state.contacts.map((entry) =>
        sameContact(entry, { userId, username, phone }) ? { ...entry, online } : entry
      ),
    })),
  setContactUnread: ({ username, chatId, count, increment = false }) =>
    set((state) => ({
      contacts: state.contacts.map((entry) => {
        const matches = entry.username === username || entry.target === username || entry.chatId === chatId;
        if (!matches) {
          return entry;
        }

        return {
          ...entry,
          unreadCount: increment ? (entry.unreadCount || 0) + 1 : count,
        };
      }),
    })),
  touchContactLastMessage: ({ currentUser, message }) =>
    set((state) => {
      const contacts = state.contacts.map((entry) => {
        if (!messageMatchesContact(message, entry)) {
          return entry;
        }

        return {
          ...entry,
          chatId: entry.chatId || message.chatId,
          lastMessageAt: getMessageTime(message),
          lastMessagePreview: getLastMessagePreview({ conversation: entry, currentUser, message }),
        };
      });

      return { contacts: sortByLastMessage(contacts) };
    }),
  setGroups: (groups) => set({ groups }),
  upsertGroup: (group) =>
    set((state) => {
      const existing = state.groups.find((entry) => entry._id === group._id || entry.name === group.name);
      const groups = existing
        ? state.groups.map((entry) => (entry._id === group._id || entry.name === group.name ? { ...entry, ...group } : entry))
        : [...state.groups, group];
      return { groups };
    }),
  setMessages: (conversationKey, messages) =>
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationKey]: messages,
      },
    })),
  appendMessage: (conversationKey, message) =>
    set((state) => {
      const existing = state.messagesByConversation[conversationKey] || [];
      const nextIdentity = messageIdentity(message);
      const nextMessages =
        nextIdentity && existing.some((entry) => messageIdentity(entry) === nextIdentity)
          ? existing.map((entry) => (messageIdentity(entry) === nextIdentity ? { ...entry, ...message } : entry))
          : [...existing, message];

      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationKey]: nextMessages,
        },
      };
    }),
  prependMessages: (conversationKey, messages) =>
    set((state) => {
      const existing = state.messagesByConversation[conversationKey] || [];
      const existingIds = new Set(existing.map((message) => message._id).filter(Boolean));
      const nextMessages = messages.filter((message) => !message._id || !existingIds.has(message._id));

      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationKey]: [...nextMessages, ...existing],
        },
      };
    }),
  updateMessage: (conversationKey, messageId, updater) =>
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationKey]: (state.messagesByConversation[conversationKey] || []).map((message) =>
          message._id === messageId ? updater(message) : message
        ),
      },
    })),
  removeMessage: (conversationKey, messageId) =>
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationKey]: (state.messagesByConversation[conversationKey] || []).filter((message) => message._id !== messageId),
      },
    })),
  setPins: (chatId, pins) =>
    set((state) => ({
      pinsByChat: {
        ...state.pinsByChat,
        [chatId]: pins,
      },
    })),
  upsertPin: (chatId, pin) =>
    set((state) => {
      const existing = state.pinsByChat[chatId] || [];
      const found = existing.some((entry) => entry._id === pin._id);
      return {
        pinsByChat: {
          ...state.pinsByChat,
          [chatId]: found ? existing.map((entry) => (entry._id === pin._id ? pin : entry)) : [pin, ...existing],
        },
      };
    }),
  removePin: (chatId, messageId) =>
    set((state) => ({
      pinsByChat: {
        ...state.pinsByChat,
        [chatId]: (state.pinsByChat[chatId] || []).filter((pin) => pin._id !== messageId),
      },
    })),
  upsertPoll: (chatId, poll) =>
    set((state) => {
      const existing = state.pollsByChat[chatId] || [];
      const found = existing.some((entry) => (entry.id || entry._id) === (poll.id || poll._id));
      return {
        pollsByChat: {
          ...state.pollsByChat,
          [chatId]: found
            ? existing.map((entry) => ((entry.id || entry._id) === (poll.id || poll._id) ? { ...entry, ...poll } : entry))
            : [...existing, poll],
        },
      };
    }),
  setActiveConversation: (activeConversation) => set({ activeConversation }),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setPinsOpen: (pinsOpen) => set({ pinsOpen }),
  setThreadOpen: (threadOpen) => set({ threadOpen }),
  setThreadData: ({ parent, replies }) => set({ threadParent: parent, threadMessages: replies }),
}));

export const useUiStore = create((set) => ({
  toasts: [],
  pushToast: (message, variant = 'info', title = '') =>
    set((state) => ({ toasts: [...state.toasts, buildToast(message, variant, title)] })),
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));
