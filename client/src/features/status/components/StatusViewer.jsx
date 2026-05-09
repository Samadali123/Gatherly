import { ChevronLeft, ChevronRight, SendHorizontal, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function StatusViewer({ canReply = false, groups = null, onClose, onReply, statuses = [], user }) {
  const storyGroups = groups?.length ? groups : [{ user, statuses, canReply }];
  const resumeTimerRef = useRef(null);
  const [groupIndex, setGroupIndex] = useState(0);
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reply, setReply] = useState('');
  const activeGroup = storyGroups[groupIndex];
  const activeStatuses = activeGroup?.statuses || [];
  const activeUser = activeGroup?.user;
  const canReplyActive = activeGroup?.canReply ?? canReply;
  const status = activeStatuses[index];
  const progress = useMemo(() => `${index + 1} / ${activeStatuses.length}`, [index, activeStatuses.length]);
  const hasNextStatus = index < activeStatuses.length - 1 || groupIndex < storyGroups.length - 1;

  const pauseTemporarily = () => {
    setIsPaused(true);
    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = window.setTimeout(() => setIsPaused(false), 6000);
  };

  const goNext = ({ pause = true } = {}) => {
    if (pause) pauseTemporarily();

    if (index < activeStatuses.length - 1) {
      setIndex((current) => current + 1);
      return;
    }

    if (groupIndex < storyGroups.length - 1) {
      setGroupIndex((current) => current + 1);
      setIndex(0);
      return;
    }

    onClose?.();
  };

  const goPrevious = () => {
    pauseTemporarily();

    if (index > 0) {
      setIndex((current) => current - 1);
      return;
    }

    if (groupIndex > 0) {
      const previousGroup = storyGroups[groupIndex - 1];
      setGroupIndex((current) => current - 1);
      setIndex(Math.max(0, (previousGroup?.statuses?.length || 1) - 1));
    }
  };

  useEffect(() => {
    if (!status || !hasNextStatus || isPaused) return undefined;
    const timerId = window.setTimeout(() => goNext({ pause: false }), 60000);
    return () => window.clearTimeout(timerId);
  }, [groupIndex, hasNextStatus, index, isPaused, status?._id]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) {
        window.clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  if (!status) {
    return null;
  }

  const sendReply = async () => {
    if (!reply.trim()) return;
    await onReply?.(status._id, reply.trim());
    setReply('');
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(36,81,67,0.92)] px-2 py-3 sm:px-4 sm:py-6">
      <div
        className="relative flex h-full max-h-[860px] w-full max-w-[460px] flex-col overflow-hidden rounded-xl border border-white/20 bg-[#102E26] shadow-[0_20px_80px_rgba(36,81,67,0.35)]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="absolute left-0 right-0 top-0 z-10 p-4">
          <div className="mb-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${activeStatuses.length}, minmax(0, 1fr))` }}>
            {activeStatuses.map((entry, entryIndex) => (
              <span className={`h-1 rounded-full ${entryIndex <= index ? 'bg-white' : 'bg-white/30'}`} key={entry._id} />
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 text-white">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-medium">{activeUser?.name || activeUser?.username || 'Status'}</p>
              <p className="text-[12px] text-white/70">{progress}{storyGroups.length > 1 ? ` / ${groupIndex + 1} of ${storyGroups.length}` : ''}</p>
            </div>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/12" onClick={onClose} type="button">
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center">
          {status.type === 'image' ? <img alt="Status" className="status-fade-in h-full w-full object-contain" key={status._id} src={status.mediaUrl} /> : null}
          {status.type === 'video' ? <video autoPlay className="status-fade-in h-full w-full object-contain" controls key={status._id} src={status.mediaUrl} /> : null}
          {status.type === 'text' ? (
            <div
              className="status-fade-in flex h-full w-full items-center justify-center overflow-y-auto whitespace-pre-wrap break-words px-5 py-24 text-center leading-tight sm:px-8"
              key={status._id}
              style={{
                background: status.style?.background || '#245143',
                color: status.style?.color || '#FFFFFF',
                fontSize: `clamp(20px, 8vw, ${status.style?.fontSize || 28}px)`,
                fontWeight: status.style?.bold ? 700 : 500,
                fontStyle: status.style?.italic ? 'italic' : 'normal',
                fontFamily: status.style?.fontFamily || '"DM Sans", system-ui, sans-serif',
                textAlign: status.style?.align || 'center',
                overflowWrap: 'anywhere',
              }}
            >
              {status.text}
            </div>
          ) : null}
        </div>

        {activeStatuses.length > 1 ? (
          <div className="flex items-center justify-center gap-2 bg-[#102E26]/95 px-4 py-3">
            {activeStatuses.map((entry, entryIndex) => (
              <button
                aria-label={`View status ${entryIndex + 1}`}
                className={`h-2.5 rounded-full transition-all ${entryIndex === index ? 'w-6 bg-white' : 'w-2.5 bg-white/35 hover:bg-white/60'}`}
                key={entry._id}
                onClick={() => {
                  pauseTemporarily();
                  setIndex(entryIndex);
                }}
                type="button"
              />
            ))}
          </div>
        ) : null}

        {canReplyActive ? (
          <div className="border-t border-white/10 bg-[#102E26]/95 p-3">
            <div className="chat-send-input flex items-center gap-2 rounded-full border border-white/20 bg-white px-3 py-2">
              <input
                className="min-h-9 flex-1 bg-transparent text-[14px] text-text-primary"
                onChange={(event) => setReply(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    sendReply();
                  }
                }}
                placeholder="Reply to status"
                value={reply}
              />
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary text-white" onClick={sendReply} type="button">
                <SendHorizontal size={15} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
      {activeStatuses.length > 1 || storyGroups.length > 1 ? (
        <>
          <button
            className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white text-brand-primary shadow-card disabled:opacity-40 sm:left-[calc(50%-330px)]"
            disabled={groupIndex === 0 && index === 0}
            onClick={() => goPrevious()}
            type="button"
          >
            <ChevronLeft size={22} strokeWidth={1.7} />
          </button>
          <button
            className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white text-brand-primary shadow-card sm:right-[calc(50%-330px)]"
            onClick={() => goNext()}
            type="button"
          >
            <ChevronRight size={22} strokeWidth={1.7} />
          </button>
        </>
      ) : null}
    </div>
  );
}
