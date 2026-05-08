import assert from 'node:assert/strict';
import test from 'node:test';
import { getEmojiPickerPosition } from './emojiPickerPosition.js';

test('opens above the trigger by default', () => {
  const position = getEmojiPickerPosition({
    triggerRect: { left: 500, right: 540, top: 500, bottom: 540 },
    viewportWidth: 1200,
    viewportHeight: 900,
  });

  assert.equal(position.placement, 'top');
  assert.equal(position.top, 57);
  assert.equal(position.left, 344);
});

test('opens below when there is not enough space above', () => {
  const position = getEmojiPickerPosition({
    triggerRect: { left: 120, right: 160, top: 220, bottom: 260 },
    viewportWidth: 1200,
    viewportHeight: 900,
  });

  assert.equal(position.placement, 'bottom');
  assert.equal(position.top, 268);
});

test('clamps horizontally inside the viewport', () => {
  const position = getEmojiPickerPosition({
    triggerRect: { left: 4, right: 44, top: 500, bottom: 540 },
    viewportWidth: 360,
    viewportHeight: 800,
  });

  assert.equal(position.left, 12);
});

test('clamps horizontally inside the chat conversation boundary', () => {
  const position = getEmojiPickerPosition({
    boundaryRect: { left: 400, right: 1900, top: 180, bottom: 900 },
    triggerRect: { left: 410, right: 450, top: 560, bottom: 640 },
    viewportWidth: 1920,
    viewportHeight: 1000,
  });

  assert.equal(position.left, 412);
});

test('uses available space above within the chat boundary', () => {
  const position = getEmojiPickerPosition({
    boundaryRect: { left: 400, right: 1900, top: 370, bottom: 900 },
    pickerHeight: 435,
    triggerRect: { left: 900, right: 1040, top: 560, bottom: 640 },
    viewportWidth: 1920,
    viewportHeight: 1000,
  });

  assert.equal(position.placement, 'bottom');
});

test('opens the compact reaction bar above when the bar fits above the message', () => {
  const position = getEmojiPickerPosition({
    boundaryRect: { left: 400, right: 1900, top: 380, bottom: 900 },
    pickerHeight: 56,
    pickerWidth: 292,
    triggerRect: { left: 680, right: 1180, top: 457, bottom: 790 },
    viewportWidth: 1920,
    viewportHeight: 1000,
  });

  assert.equal(position.placement, 'top');
  assert.equal(position.top, 393);
});
