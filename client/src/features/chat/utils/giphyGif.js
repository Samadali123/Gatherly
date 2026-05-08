const giphyBaseUrl = 'https://api.giphy.com/v1/gifs';
const pageSize = 24;

export const buildGiphyUrl = ({ apiKey, offset = 0, query = '' }) => {
  const endpoint = query.trim() ? 'search' : 'trending';
  const params = new URLSearchParams();

  params.set('api_key', apiKey);

  if (query.trim()) {
    params.set('q', query.trim());
  }

  params.set('limit', String(pageSize));
  params.set('offset', String(offset || 0));
  params.set('rating', 'pg-13');
  params.set('lang', 'en');

  return `${giphyBaseUrl}/${endpoint}?${params.toString()}`;
};

export const getNextGiphyOffset = (pagination = {}) => {
  const count = Number(pagination.count || 0);
  const offset = Number(pagination.offset || 0);
  const total = Number(pagination.total_count || 0);
  const nextOffset = offset + count;

  return count > 0 && nextOffset < total ? String(nextOffset) : '';
};

export const mapGiphyGif = (result) => {
  const still = result?.images?.fixed_width_small_still;
  const preview = result?.images?.fixed_width_small || result?.images?.downsized;
  const full = result?.images?.original || result?.images?.downsized_large || result?.images?.downsized;

  if (!preview?.url || !full?.url) {
    return null;
  }

  return {
    id: result.id,
    alt: result.title || 'GIF',
    gifUrl: full.url,
    height: Number(preview.height) || 160,
    posterUrl: still?.url || preview.url,
    previewUrl: preview.url,
    width: Number(preview.width) || 160,
  };
};
