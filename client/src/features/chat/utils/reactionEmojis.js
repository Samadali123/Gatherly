export const defaultReactionEmojis = ['👍', '❤️', '😂', '😮', '😢'];
export const reactionEmojiStorageKey = 'gatherly:reaction-emojis';

export const recordReactionEmoji = (emoji, history = []) => {
  const now = Date.now();
  const existing = history.find((entry) => entry.emoji === emoji);
  const withoutEmoji = history.filter((entry) => entry.emoji !== emoji);

  return [
    {
      emoji,
      count: (existing?.count || 0) + 1,
      lastUsedAt: now,
    },
    ...withoutEmoji,
  ].slice(0, 24);
};

export const getFrequentReactionEmojis = (history = []) => {
  const sorted = [...history]
    .filter((entry) => entry?.emoji)
    .sort((a, b) => (b.count || 0) - (a.count || 0) || (b.lastUsedAt || 0) - (a.lastUsedAt || 0))
    .map((entry) => entry.emoji);
  const merged = [...sorted, ...defaultReactionEmojis];

  return Array.from(new Set(merged)).slice(0, 5);
};

export const loadReactionEmojiHistory = () => {
  try {
    const value = window.localStorage.getItem(reactionEmojiStorageKey);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
};

export const saveReactionEmojiHistory = (history) => {
  try {
    window.localStorage.setItem(reactionEmojiStorageKey, JSON.stringify(history));
  } catch {}
};
