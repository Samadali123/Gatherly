import assert from 'node:assert/strict';
import test from 'node:test';
import { getFrequentReactionEmojis, recordReactionEmoji } from './reactionEmojis.js';

test('uses default reactions when there is no stored history', () => {
  assert.deepEqual(getFrequentReactionEmojis(), ['👍', '❤️', '😂', '😮', '😢']);
});

test('orders frequent reactions by count and recent use', () => {
  const history = recordReactionEmoji('🙏', recordReactionEmoji('😂', recordReactionEmoji('🙏', [])));

  assert.deepEqual(getFrequentReactionEmojis(history), ['🙏', '😂', '👍', '❤️', '😮']);
});
