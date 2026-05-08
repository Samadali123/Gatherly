import assert from 'node:assert/strict';
import test from 'node:test';
import { getLastMessagePreview } from './lastMessagePreview.js';

test('shows text content for one-to-one messages without other-user prefix', () => {
  assert.equal(
    getLastMessagePreview({
      currentUser: { username: 'samad' },
      message: { sender: 'salim', msg: 'sounds good' },
    }),
    'sounds good'
  );
});

test('prefixes own messages with You', () => {
  assert.equal(
    getLastMessagePreview({
      currentUser: { username: 'samad' },
      message: { sender: 'samad', msg: 'done' },
    }),
    'You: done'
  );
});

test('maps attachment message types', () => {
  assert.equal(getLastMessagePreview({ message: { attachments: [{ type: 'image' }] } }), '📷 Photo');
  assert.equal(getLastMessagePreview({ message: { attachments: [{ type: 'audio' }] } }), '🎤 Voice message');
  assert.equal(getLastMessagePreview({ message: { type: 'gif' } }), 'GIF');
});

test('prefixes group messages with first name', () => {
  assert.equal(
    getLastMessagePreview({
      conversation: { type: 'group' },
      currentUser: { username: 'samad' },
      message: { sender: 'rahul.k', senderName: 'Rahul Kumar', msg: '5 pm' },
    }),
    'Rahul: 5 pm'
  );
});
