import assert from 'node:assert/strict';
import test from 'node:test';
import { buildGiphyUrl, getNextGiphyOffset, mapGiphyGif } from './giphyGif.js';

test('builds trending Giphy URL when query is empty', () => {
  const url = buildGiphyUrl({ apiKey: 'key', offset: 24, query: '' });

  assert.equal(
    url,
    'https://api.giphy.com/v1/gifs/trending?api_key=key&limit=24&offset=24&rating=pg-13&lang=en'
  );
});

test('builds search Giphy URL when query is present', () => {
  const url = buildGiphyUrl({ apiKey: 'key', query: 'hello world' });

  assert.equal(
    url,
    'https://api.giphy.com/v1/gifs/search?api_key=key&q=hello+world&limit=24&offset=0&rating=pg-13&lang=en'
  );
});

test('maps Giphy result to poster, preview, and send URLs', () => {
  const gif = mapGiphyGif({
    id: 'abc',
    title: 'Wave',
    images: {
      fixed_width_small_still: { url: 'https://example.com/still.gif' },
      fixed_width_small: { url: 'https://example.com/preview.gif', width: '120', height: '90' },
      original: { url: 'https://example.com/full.gif' },
    },
  });

  assert.deepEqual(gif, {
    id: 'abc',
    alt: 'Wave',
    gifUrl: 'https://example.com/full.gif',
    height: 90,
    posterUrl: 'https://example.com/still.gif',
    previewUrl: 'https://example.com/preview.gif',
    width: 120,
  });
});

test('returns next offset while more Giphy results are available', () => {
  assert.equal(getNextGiphyOffset({ count: 24, offset: 24, total_count: 80 }), '48');
  assert.equal(getNextGiphyOffset({ count: 8, offset: 72, total_count: 80 }), '');
});
