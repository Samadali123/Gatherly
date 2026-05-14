import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getEmojiPickerPosition } from '../utils/emojiPickerPosition';
import { buildGiphyUrl, getNextGiphyOffset, mapGiphyGif } from '../utils/giphyGif';

const apiKey = import.meta.env.VITE_GIPHY_API_KEY || '';

export default function ChatEmojiGifPicker({ anchorEl, onClose, onGifSelect, onStickerSelect, open, tab, triggerEl, onTabChange }) {
  const pickerRef = useRef(null);
  const gridRef = useRef(null);
  const requestRef = useRef(0);
  const loadingRef = useRef(false);
  const [gifs, setGifs] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nextOffset, setNextOffset] = useState('');
  const [position, setPosition] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open || !anchorEl) {
      setPosition(null);
      return undefined;
    }

    const updatePosition = () => {
      setPosition(getEmojiPickerPosition({
        horizontalOffset: -24,
        pickerHeight: 480,
        pickerWidth: 352,
        triggerRect: anchorEl.getBoundingClientRect(),
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      }));
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorEl, open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleMouseDown = (event) => {
      if (pickerRef.current?.contains(event.target) || triggerEl?.contains(event.target)) {
        return;
      }

      onClose?.();
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose, open, triggerEl]);

  const fetchGifs = async ({ append = false, offset = 0, value = query } = {}) => {
    if (!apiKey) {
      setGifs([]);
      setNextOffset('');
      return;
    }

    if (append && loadingRef.current) {
      return;
    }

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    loadingRef.current = true;
    setLoading(true);
    try {
      const response = await fetch(buildGiphyUrl({ apiKey, offset, query: value }));
      const payload = await response.json();
      if (requestId !== requestRef.current) {
        return;
      }
      const nextGifs = (payload.data || []).map(mapGiphyGif).filter(Boolean);
      setGifs((current) => {
        const merged = append ? [...current, ...nextGifs] : nextGifs;
        return Array.from(new Map(merged.map((gif) => [gif.id, gif])).values());
      });
      setNextOffset(getNextGiphyOffset(payload.pagination));
    } finally {
      if (requestId === requestRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!open || tab !== 'gifs') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      fetchGifs({ value: query });
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [open, query, tab]);

  useEffect(() => {
    if (!open || tab !== 'gifs') {
      return;
    }

    requestRef.current += 1;
    loadingRef.current = false;
    setLoading(false);
    setQuery('');
    setGifs([]);
    setNextOffset('');
  }, [open, tab]);

  const handleScroll = () => {
    const grid = gridRef.current;

    if (!grid || loading || !nextOffset || grid.scrollTop + grid.clientHeight < grid.scrollHeight - 80) {
      return;
    }

    fetchGifs({ append: true, offset: nextOffset });
  };

  if (!open || !position) {
    return null;
  }

  return createPortal(
    <div
      className="fixed z-[100] flex h-[480px] w-[min(352px,calc(100vw-24px))] flex-col overflow-hidden rounded-xl border border-border-default bg-white shadow-[0_18px_60px_rgba(23,35,32,0.18)]"
      ref={pickerRef}
      style={{ left: position.left, top: position.top }}
    >
      <div className="grid grid-cols-2 gap-2 border-b border-border-default p-2">
        {[
          ['stickers', 'Stickers'],
          ['gifs', 'GIFs'],
        ].map(([value, label]) => (
          <button
            className={`min-h-10 rounded-lg px-3 text-[13px] font-medium transition ${
              tab === value ? 'bg-brand-subtle text-brand-primary' : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
            }`}
            key={value}
            onClick={() => onTabChange?.(value)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'stickers' ? (
        <div className="min-h-0 flex-1 overflow-hidden">
          <Picker
            data={data}
            maxFrequentRows={1}
            onEmojiSelect={(emoji) => {
              onStickerSelect?.(emoji.native);
              onClose?.();
            }}
            previewPosition="none"
            set="native"
            skinTonePosition="none"
            theme="auto"
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="p-3">
            <label className="flex min-h-11 items-center gap-2 rounded-full border border-border-default bg-bg-secondary px-3 text-text-secondary">
              <Search size={16} strokeWidth={1.5} />
              <input
                className="min-w-0 flex-1 bg-transparent text-[14px] text-text-primary placeholder:text-text-secondary"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search GIFs..."
                value={query}
              />
              {query ? (
                <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-brand-subtle" onClick={() => setQuery('')} type="button">
                  <X size={15} strokeWidth={1.5} />
                </button>
              ) : null}
            </label>
          </div>

          <div className="scrollbar-chat min-h-0 flex-1 overflow-y-auto px-3" onScroll={handleScroll} ref={gridRef}>
            {!apiKey ? (
              <div className="rounded-lg bg-brand-subtle px-3 py-4 text-center text-[13px] leading-[1.5] text-text-primary">
                Add Giphy Api key
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-1">
              {gifs.map((gif) => (
                <button
                  className="cursor-pointer overflow-hidden rounded-md bg-bg-tertiary"
                  key={gif.id}
                  onClick={() => {
                    onClose?.();
                    onGifSelect?.({ type: 'gif', gifUrl: gif.gifUrl, previewUrl: gif.previewUrl });
                  }}
                  onMouseEnter={() => setHoveredId(gif.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  type="button"
                >
                  <img alt={gif.alt} className="h-28 w-full object-cover" loading="lazy" src={hoveredId === gif.id ? gif.previewUrl : gif.posterUrl} />
                </button>
              ))}
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <span className="h-28 animate-pulse rounded-md bg-bg-tertiary" key={`skeleton-${index}`} />
                  ))
                : null}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
