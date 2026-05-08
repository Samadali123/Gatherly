import { Maximize, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const formatTime = (value) => {
  if (!Number.isFinite(value)) {
    return '0:00';
  }

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export default function MediaPlayer({ src, type = 'video', compact = false, onExpand }) {
  const mediaRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) {
      return undefined;
    }

    const syncTime = () => setCurrentTime(media.currentTime || 0);
    const syncDuration = () => {
      setDuration(media.duration || 0);
      setLoading(false);
    };
    const handleWaiting = () => setLoading(true);
    const handleCanPlay = () => setLoading(false);
    const handleEnded = () => setPlaying(false);

    media.addEventListener('timeupdate', syncTime);
    media.addEventListener('loadedmetadata', syncDuration);
    media.addEventListener('waiting', handleWaiting);
    media.addEventListener('canplay', handleCanPlay);
    media.addEventListener('ended', handleEnded);

    return () => {
      media.removeEventListener('timeupdate', syncTime);
      media.removeEventListener('loadedmetadata', syncDuration);
      media.removeEventListener('waiting', handleWaiting);
      media.removeEventListener('canplay', handleCanPlay);
      media.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  const togglePlay = async () => {
    const media = mediaRef.current;
    if (!media) {
      return;
    }

    if (media.paused) {
      await media.play();
      setPlaying(true);
      return;
    }

    media.pause();
    setPlaying(false);
  };

  const changeSpeed = () => {
    const next = speed === 1 ? 1.25 : speed === 1.25 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(next);
    if (mediaRef.current) {
      mediaRef.current.playbackRate = next;
    }
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const shellClass = type === 'audio'
    ? 'rounded-xl bg-white p-3'
    : compact
      ? 'aspect-video max-h-[210px] w-full overflow-hidden rounded-lg bg-[#0f1f1b]'
      : 'aspect-video max-h-[76vh] w-full overflow-hidden rounded-xl bg-[#0f1f1b]';

  return (
    <div className={shellClass}>
      <div className={type === 'audio' ? 'flex items-center gap-3' : 'relative h-full w-full'}>
        {type === 'audio' ? (
          <audio preload="metadata" ref={mediaRef} src={src} />
        ) : (
          <video className="h-full w-full object-contain" preload="metadata" ref={mediaRef} src={src} />
        )}

        {type !== 'audio' && loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0f1f1b]/70">
            <span className="h-11 w-11 animate-spin rounded-full border-4 border-[#b9d8ce] border-t-brand-primary" />
          </div>
        ) : null}

        {type === 'audio' ? (
          <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white" onClick={togglePlay} type="button">
            {playing ? <Pause size={17} strokeWidth={1.7} /> : <Play size={17} strokeWidth={1.7} />}
          </button>
        ) : null}

        <div className={type === 'audio' ? 'min-w-0 flex-1' : 'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white'}>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-brand-primary" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {type !== 'audio' ? (
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white" onClick={togglePlay} type="button">
                  {playing ? <Pause size={16} strokeWidth={1.7} /> : <Play size={16} strokeWidth={1.7} />}
                </button>
              ) : null}
              <span className={`text-[12px] font-medium ${type === 'audio' ? 'text-text-secondary' : 'text-white/85'}`}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {type !== 'audio' ? (
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white" onClick={() => {
                  const nextMuted = !muted;
                  setMuted(nextMuted);
                  if (mediaRef.current) mediaRef.current.muted = nextMuted;
                }} type="button">
                  {muted ? <VolumeX size={15} strokeWidth={1.7} /> : <Volume2 size={15} strokeWidth={1.7} />}
                </button>
              ) : null}
              <button
                className={`${type === 'audio' ? 'bg-brand-subtle text-text-secondary' : 'bg-white/15 text-white'} h-9 rounded-full px-3 text-[12px] font-medium`}
                onClick={changeSpeed}
                type="button"
              >
                {speed}x
              </button>
              {type !== 'audio' && onExpand ? (
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white" onClick={onExpand} type="button">
                  <Maximize size={15} strokeWidth={1.7} />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
