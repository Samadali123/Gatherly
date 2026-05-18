import { AlertCircle, Maximize, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const formatTime = (value) => {
  if (!Number.isFinite(value)) {
    return '0:00';
  }

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export default function MediaPlayer({ src, type = 'video', compact = false, durationHint = 0, onExpand, mimeType = '' }) {
  const mediaRef = useRef(null);
  const normalizedDurationHint = Number(durationHint) > 0 ? Number(durationHint) : 0;
  const [playbackSrc, setPlaybackSrc] = useState(src || '');
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(normalizedDurationHint);
  const [currentTime, setCurrentTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [playbackError, setPlaybackError] = useState('');

  useEffect(() => {
    setPlaying(false);
    setLoading(Boolean(src));
    setDuration(normalizedDurationHint);
    setCurrentTime(0);
    setPlaybackError('');

    if (type !== 'audio' || !src || src.startsWith('blob:') || src.startsWith('data:')) {
      setPlaybackSrc(src || '');
      return undefined;
    }

    let cancelled = false;
    let objectUrl = '';

    fetch(src, { mode: 'cors', credentials: 'omit' })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Audio fetch failed');
        }
        return response.blob();
      })
      .then((blob) => {
        // Enforce a correct audio/video MIME prefix so that Chrome/Brave
        // will always play it successfully in the appropriate media tag.
        let targetType = type === 'audio' ? 'audio/webm' : 'video/mp4';
        
        if (blob.type && blob.type.startsWith(type)) {
          targetType = blob.type;
        } else if (mimeType && mimeType.startsWith(type)) {
          targetType = mimeType;
        }

        // Remap application/octet-stream or generic CDNs content-types to a highly compatible audio codec
        if (targetType === 'application/octet-stream') {
          targetType = type === 'audio' ? 'audio/webm' : 'video/mp4';
        }

        const playableBlob = new Blob([blob], { type: targetType });
        const nextUrl = URL.createObjectURL(playableBlob);

        if (cancelled) {
          URL.revokeObjectURL(nextUrl);
          return;
        }

        objectUrl = nextUrl;
        setPlaybackSrc(nextUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setPlaybackSrc(src);
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src, type, mimeType, normalizedDurationHint]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media || !playbackSrc) {
      return undefined;
    }

    const syncTime = () => setCurrentTime(media.currentTime || 0);
    setDuration(normalizedDurationHint);

    const syncDuration = () => {
      const nextDuration = normalizedDurationHint || media.duration || 0;
      setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
      setLoading(false);
    };
    const handleWaiting = () => setLoading(true);
    const handleCanPlay = () => {
      setPlaybackError('');
      setLoading(false);
    };
    const handleEnded = () => setPlaying(false);
    const handleError = () => {
      setPlaybackError(type === 'audio'
        ? 'This voice note could not be played. Please try again or ask the sender to resend it.'
        : 'This video could not be played.');
      setLoading(false);
      setPlaying(false);
    };

    media.addEventListener('timeupdate', syncTime);
    media.addEventListener('loadedmetadata', syncDuration);
    media.addEventListener('durationchange', syncDuration);
    media.addEventListener('waiting', handleWaiting);
    media.addEventListener('canplay', handleCanPlay);
    media.addEventListener('ended', handleEnded);
    media.addEventListener('error', handleError);

    return () => {
      media.removeEventListener('timeupdate', syncTime);
      media.removeEventListener('loadedmetadata', syncDuration);
      media.removeEventListener('durationchange', syncDuration);
      media.removeEventListener('waiting', handleWaiting);
      media.removeEventListener('canplay', handleCanPlay);
      media.removeEventListener('ended', handleEnded);
      media.removeEventListener('error', handleError);
    };
  }, [playbackSrc, type, normalizedDurationHint]);

  const togglePlay = async () => {
    const media = mediaRef.current;
    if (!media) {
      return;
    }

    if (media.paused) {
      try {
        await media.play();
        setPlaying(true);
        setPlaybackError('');
      } catch {
        setPlaybackError(type === 'audio' ? 'This voice note could not start. Please try again.' : 'This video could not start.');
        setPlaying(false);
      }
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
  const seekAudio = (event) => {
    const media = mediaRef.current;
    if (!media || !duration) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    media.currentTime = ratio * duration;
    setCurrentTime(media.currentTime);
  };

  const shellClass = type === 'audio'
    ? 'rounded-xl bg-white p-3'
    : compact
      ? 'aspect-video max-h-[210px] w-full overflow-hidden rounded-lg bg-[#0f1f1b]'
      : 'aspect-video max-h-[76vh] w-full overflow-hidden rounded-xl bg-[#0f1f1b]';

  if (type === 'audio') {
    return (
      <div className="rounded-2xl bg-white p-3">
        <audio preload="auto" ref={mediaRef} src={playbackSrc} />
        <div className="flex min-w-[240px] max-w-full items-center gap-3">
          <button
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white transition hover:bg-brand-hover active:scale-95"
            onClick={togglePlay}
            type="button"
          >
            {playing ? <Pause size={18} strokeWidth={1.7} /> : <Play size={18} strokeWidth={1.7} />}
          </button>
          <div className="min-w-0 flex-1">
            <button
              aria-label="Seek voice note"
              className="group flex h-6 w-full items-center"
              onClick={seekAudio}
              type="button"
            >
              <span className="block h-1.5 w-full overflow-hidden rounded-full bg-brand-subtle">
                <span className="block h-full rounded-full bg-brand-primary transition-[width]" style={{ width: `${progress}%` }} />
              </span>
            </button>
            <div className="mt-1 flex items-center justify-between gap-3">
              <span className="text-[12px] font-medium text-text-secondary">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <button
                className="rounded-full bg-brand-subtle px-2.5 py-1 text-[12px] font-medium text-text-secondary transition hover:text-brand-primary"
                onClick={changeSpeed}
                type="button"
              >
                {speed}x
              </button>
            </div>
          </div>
        </div>
        {playbackError ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-[#fff4ef] px-3 py-2 text-[12px] leading-[1.5] text-text-primary">
            <AlertCircle className="mt-0.5 shrink-0 text-[#9a3412]" size={14} strokeWidth={1.7} />
            <span>{playbackError}</span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <div className={type === 'audio' ? 'flex items-center gap-3' : 'relative h-full w-full'}>
        <video className="h-full w-full object-contain" playsInline preload="auto" ref={mediaRef} src={playbackSrc} />

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
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white"
                  onClick={() => {
                    const nextMuted = !muted;
                    setMuted(nextMuted);
                    if (mediaRef.current) mediaRef.current.muted = nextMuted;
                  }}
                  type="button"
                >
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
      {playbackError ? (
        <div className={`${type === 'audio' ? 'mt-3' : 'absolute left-3 right-3 top-3'} flex items-start gap-2 rounded-lg bg-[#fff4ef] px-3 py-2 text-[12px] leading-[1.5] text-text-primary`}>
          <AlertCircle className="mt-0.5 shrink-0 text-[#9a3412]" size={14} strokeWidth={1.7} />
          <span>{playbackError}</span>
        </div>
      ) : null}
    </div>
  );
}
