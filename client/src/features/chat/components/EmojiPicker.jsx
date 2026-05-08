import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getEmojiPickerPosition } from '../utils/emojiPickerPosition';
import {
  getFrequentReactionEmojis,
  loadReactionEmojiHistory,
  recordReactionEmoji,
  saveReactionEmojiHistory,
} from '../utils/reactionEmojis';

export default function EmojiPicker({ anchorEl, boundaryEl, onClose, onSelect, open, triggerEl }) {
  const pickerRef = useRef(null);
  const [position, setPosition] = useState(null);
  const [fullOpen, setFullOpen] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!open) {
      setFullOpen(false);
      return;
    }

    setHistory(loadReactionEmojiHistory());
  }, [open]);

  useEffect(() => {
    if (!open || !anchorEl) {
      setPosition(null);
      return undefined;
    }

    const updatePosition = () => {
      setPosition(getEmojiPickerPosition({
        boundaryRect: boundaryEl?.getBoundingClientRect(),
        horizontalOffset: fullOpen ? 0 : -44,
        pickerHeight: fullOpen ? 435 : 56,
        pickerWidth: fullOpen ? 352 : 292,
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
  }, [anchorEl, boundaryEl, fullOpen, open]);

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

  if (!open || !position) {
    return null;
  }

  const selectEmoji = (emoji) => {
    const nextHistory = recordReactionEmoji(emoji, history);
    setHistory(nextHistory);
    saveReactionEmojiHistory(nextHistory);
    onSelect?.(emoji);
    onClose?.();
  };

  return createPortal(
    <div
      className="fixed z-[100]"
      ref={pickerRef}
      style={{
        left: position.left,
        top: position.top,
      }}
    >
      {fullOpen ? (
        <Picker
          data={data}
          maxFrequentRows={1}
          onEmojiSelect={(emoji) => selectEmoji(emoji.native)}
          previewPosition="none"
          set="native"
          skinTonePosition="none"
          theme="auto"
        />
      ) : (
        <div className="flex items-center gap-1 rounded-full border border-border-default bg-white px-3 py-2 shadow-[0_18px_60px_rgba(23,35,32,0.18)]">
          {getFrequentReactionEmojis(history).map((emoji) => (
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full text-[24px] transition hover:bg-brand-subtle"
              key={emoji}
              onClick={() => selectEmoji(emoji)}
              type="button"
            >
              {emoji}
            </button>
          ))}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-primary transition hover:bg-brand-subtle"
            onClick={() => setFullOpen(true)}
            type="button"
          >
            <Plus size={20} strokeWidth={1.7} />
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}
