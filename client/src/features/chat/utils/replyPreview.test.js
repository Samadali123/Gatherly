import assert from 'node:assert/strict';
import test from 'node:test';
import { buildReplyToPreview } from './replyPreview.js';

test('builds a 100 character text preview for reply metadata', () => {
  const replyTo = buildReplyToPreview({
    message: {
      _id: 'message-1',
      senderId: 'user-1',
      senderName: 'Samad Ali',
      msg: 'x'.repeat(140),
    },
  });

  assert.deepEqual(replyTo, {
    messageId: 'message-1',
    senderId: 'user-1',
    senderName: 'Samad Ali',
    contentPreview: 'x'.repeat(100),
    contentType: 'text',
    mediaUrl: '',
  });
});

test('uses image metadata when the original message is a photo', () => {
  const replyTo = buildReplyToPreview({
    message: {
      _id: 'message-2',
      sender: 'salim',
      attachments: [{ type: 'image', url: 'https://example.com/photo.png' }],
    },
  });

  assert.equal(replyTo.contentPreview, 'Photo');
  assert.equal(replyTo.contentType, 'image');
  assert.equal(replyTo.mediaUrl, 'https://example.com/photo.png');
});

test('uses file metadata when the original message has a non-image attachment', () => {
  const replyTo = buildReplyToPreview({
    message: {
      _id: 'message-3',
      sender: 'salim',
      attachments: [{ type: 'document', url: 'https://example.com/file.pdf' }],
    },
  });

  assert.equal(replyTo.contentPreview, 'File');
  assert.equal(replyTo.contentType, 'file');
});
