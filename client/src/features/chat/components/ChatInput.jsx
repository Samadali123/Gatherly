import { FileText, Image, Mic, Paperclip, Smile, Square, SendHorizontal, Video, Vote, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import PollCreator from './PollCreator';
import MediaPlayer from './MediaPlayer';
import ChatEmojiGifPicker from './ChatEmojiGifPicker';

const uploadOptions = [
  { type: 'image', label: 'Images', icon: Image, accept: 'image/jpeg,image/png,image/webp,image/gif', multiple: true },
  { type: 'video', label: 'Video', icon: Video, accept: 'video/mp4,video/webm,video/quicktime', multiple: false },
  {
    type: 'document',
    label: 'Document',
    icon: FileText,
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain',
    multiple: false,
  },
];

const getPreviewUrl = (file) => (file.type.startsWith('image/') || file.type.startsWith('video/') ? URL.createObjectURL(file) : '');

export default function ChatInput({ disabled, onSend, onCreatePoll, onUploadAttachments, pollLoading = false }) {
  const textareaRef = useRef(null);
  const fileInputRefs = useRef({});
  const stickersButtonRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingStartedAtRef = useRef(null);
  const [pollOpen, setPollOpen] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [addonsOpen, setAddonsOpen] = useState(false);
  const [stickersOpen, setStickersOpen] = useState(false);
  const [stickersTab, setStickersTab] = useState('stickers');
  const [recordingStartedAt, setRecordingStartedAt] = useState(null);
  const [recordingNow, setRecordingNow] = useState(Date.now());

  useEffect(() => () => {
    (pendingUpload?.files || []).forEach((entry) => {
      if (entry.previewUrl) {
        URL.revokeObjectURL(entry.previewUrl);
      }
    });
  }, [pendingUpload]);

  const clearPendingUpload = () => {
    (pendingUpload?.files || []).forEach((entry) => {
      if (entry.previewUrl) {
        URL.revokeObjectURL(entry.previewUrl);
      }
    });
    setPendingUpload(null);
  };

  const selectFiles = (type, fileList) => {
    const files = Array.from(fileList || []);

    if (!files.length) {
      return;
    }

    clearPendingUpload();
    setPendingUpload({
      type,
      files: files.map((file) => ({
        file,
        previewUrl: getPreviewUrl(file),
      })),
    });
    setAddonsOpen(false);
  };

  const startRecording = async () => {
    setAddonsOpen(false);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const duration = recordingStartedAtRef.current
        ? Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000))
        : 0;
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
      stream.getTracks().forEach((track) => track.stop());
      clearPendingUpload();
      setPendingUpload({
        type: 'audio',
        files: [{ file, previewUrl: URL.createObjectURL(file), duration }],
      });
      recordingStartedAtRef.current = null;
      setRecording(false);
      setAddonsOpen(false);
    };

    recorder.start();
    setRecording(true);
    const startedAt = Date.now();
    recordingStartedAtRef.current = startedAt;
    setRecordingStartedAt(startedAt);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecordingStartedAt(null);
  };

  useEffect(() => {
    if (!recording) {
      return undefined;
    }

    const intervalId = window.setInterval(() => setRecordingNow(Date.now()), 500);
    return () => window.clearInterval(intervalId);
  }, [recording]);

  const recordingSeconds = recordingStartedAt ? Math.floor((recordingNow - recordingStartedAt) / 1000) : 0;

  const submit = async () => {
    const value = textareaRef.current?.value?.trim();
    if (!value && !pendingUpload?.files?.length) {
      return;
    }

    const hasFiles = Boolean(pendingUpload?.files?.length);
    setSending(true);
    setUploading(hasFiles);
    try {
      const attachments = hasFiles
        ? await onUploadAttachments?.({
            type: pendingUpload.type,
            files: pendingUpload.files.map((entry) => entry.file),
          })
        : [];
      const attachmentsWithMetadata = (attachments || []).map((attachment, index) => ({
        ...attachment,
        ...(pendingUpload?.files?.[index]?.duration ? { duration: pendingUpload.files[index].duration } : {}),
      }));

      await onSend(value, attachmentsWithMetadata);
      clearPendingUpload();
    } finally {
      setUploading(false);
      setSending(false);
    }

    textareaRef.current.value = '';
    textareaRef.current.style.height = '52px';
  };

  const sendSticker = async (sticker) => {
    if (disabled || uploading || sending) {
      return;
    }

    setStickersOpen(false);
    setAddonsOpen(false);
    await onSend('', [{ type: 'sticker', value: sticker, url: '' }]);
  };

  const sendGif = async (gif) => {
    if (disabled || uploading || sending) {
      return;
    }

    setStickersOpen(false);
    setAddonsOpen(false);
    await onSend('', [gif]);
  };

  return (
    <div className="chat-send-input px-2 py-2 sm:px-4 sm:py-3">
      {onCreatePoll ? <PollCreator loading={pollLoading} onCreate={onCreatePoll} open={pollOpen} onClose={() => setPollOpen(false)} /> : null}
      <div className="rounded-xl bg-bg-primary">
        {pendingUpload ? (
          <div className="mb-3 overflow-hidden rounded-xl border border-border-default bg-white shadow-card">
            <div className="flex items-center justify-between gap-3 border-b border-border-default px-4 py-2.5">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-brand-primary">
                {pendingUpload.type === 'image' ? `${pendingUpload.files.length} image${pendingUpload.files.length > 1 ? 's' : ''}` : pendingUpload.type === 'audio' ? 'Voice note' : pendingUpload.type}
                </p>
                <p className="mt-0.5 text-[12px] text-text-secondary">Ready to send</p>
              </div>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border-default bg-bg-primary text-text-secondary"
                onClick={clearPendingUpload}
                type="button"
              >
                <X size={15} strokeWidth={1.5} />
              </button>
            </div>
            <div className={`grid max-h-[180px] gap-2 overflow-y-auto p-3 ${pendingUpload.type === 'image' && pendingUpload.files.length > 1 ? 'grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-4' : 'grid-cols-[minmax(0,260px)]'}`}>
              {pendingUpload.files.map((entry) => (
                <div className="relative overflow-hidden rounded-lg bg-bg-secondary shadow-sm" key={`${entry.file.name}-${entry.file.size}`}>
                  {pendingUpload.type === 'image' ? (
                    <img alt={entry.file.name} className="h-32 w-full object-cover sm:h-36" src={entry.previewUrl} />
                  ) : pendingUpload.type === 'video' ? (
                    <MediaPlayer compact src={entry.previewUrl} type="video" />
                  ) : pendingUpload.type === 'audio' ? (
                    <div className="bg-bg-secondary p-3">
                      <div className="mb-3 flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-subtle text-brand-primary"><Mic size={18} strokeWidth={1.5} /></span>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-text-primary">{entry.file.name}</p>
                          <p className="text-[12px] text-text-secondary">{Math.ceil(entry.file.size / 1024)} KB</p>
                        </div>
                      </div>
                      <MediaPlayer durationHint={entry.duration} src={entry.previewUrl} type="audio" />
                    </div>
                  ) : (
                    <div className="flex min-h-[74px] items-center gap-3 p-3">
                      <FileText className="shrink-0 text-brand-primary" size={24} strokeWidth={1.5} />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-text-primary">{entry.file.name}</p>
                        <p className="text-[12px] text-text-secondary">{Math.ceil(entry.file.size / 1024)} KB</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {recording ? (
          <div className="mb-3 rounded-xl bg-brand-subtle px-4 py-3 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white">
                  <Mic size={18} strokeWidth={1.7} />
                  <span className="absolute inset-0 animate-ping rounded-full bg-brand-primary/35" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-text-primary">Recording voice note</p>
                  <div className="mt-2 flex h-8 items-end gap-1">
                    {Array.from({ length: 18 }).map((_, index) => (
                      <span
                        className="w-1 rounded-full bg-brand-primary/80"
                        key={index}
                        style={{
                          height: `${8 + ((index * 7 + recordingSeconds * 5) % 22)}px`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <button className="min-h-11 rounded-full bg-brand-primary px-4 text-[13px] font-medium text-white" onClick={stopRecording} type="button">
                Stop {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')}
              </button>
            </div>
          </div>
        ) : null}
        <div className="flex flex-col gap-3 rounded-xl border border-border-default bg-white px-3 py-3 sm:flex-row sm:items-end">
          <textarea
            ref={textareaRef}
            className="min-h-[52px] min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-[14px] leading-[1.6] text-text-primary placeholder:text-text-secondary"
            disabled={disabled}
            maxLength={2000}
            onChange={(event) => {
              event.target.style.height = '52px';
              event.target.style.height = `${Math.min(event.target.scrollHeight, 132)}px`;
            }}
            onKeyDown={async (event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                await submit();
              }
            }}
            placeholder="Type a message"
            rows={1}
          />

          <div className="flex shrink-0 items-center justify-end gap-2">
            {onUploadAttachments ? (
              <div className="relative">
                <button
                  className={`group relative flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border-default transition hover:border-brand-primary hover:bg-brand-subtle hover:text-brand-primary ${
                    addonsOpen ? 'border-brand-primary bg-brand-subtle text-brand-primary' : 'text-text-secondary'
                  }`}
                  disabled={disabled || uploading || sending}
                  onClick={() => {
                    setAddonsOpen((current) => !current);
                    setStickersOpen(false);
                  }}
                  type="button"
                >
                  <Paperclip size={17} strokeWidth={1.5} />
                  <span className="pointer-events-none absolute bottom-[calc(100%+10px)] right-0 hidden whitespace-nowrap rounded-full border border-border-default bg-white px-3 py-1 text-[12px] font-medium text-text-primary shadow-card group-hover:block">
                    Add-ons
                  </span>
                </button>
                {addonsOpen ? (
                  <div className="absolute bottom-[calc(100%+12px)] right-0 z-20 w-[min(88vw,240px)] overflow-hidden rounded-xl border border-border-default bg-white p-2 shadow-[0_18px_60px_rgba(23,35,32,0.16)]">
                {uploadOptions.map((option) => {
                  const Icon = option.icon;

                  return (
                    <div key={option.type}>
                      <input
                        accept={option.accept}
                        className="hidden"
                        multiple={option.multiple}
                        onChange={(event) => {
                          selectFiles(option.type, event.target.files);
                          event.target.value = '';
                        }}
                        ref={(node) => {
                          fileInputRefs.current[option.type] = node;
                        }}
                        type="file"
                      />
                      <button
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-text-primary transition hover:bg-brand-subtle"
                        disabled={disabled || uploading || sending}
                        onClick={() => fileInputRefs.current[option.type]?.click()}
                        type="button"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-brand-primary">
                          <Icon size={16} strokeWidth={1.5} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-medium">{option.label}</span>
                          <span className="block text-[12px] text-text-secondary">
                            {option.type === 'image' ? 'Up to 6 photos' : option.type === 'video' ? 'One playable clip' : 'PDF, Word, Excel or text'}
                          </span>
                        </span>
                      </button>
                    </div>
                  );
                })}
                    <button
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-brand-subtle ${
                        recording ? 'text-brand-primary' : 'text-text-primary'
                      }`}
                      disabled={disabled || uploading || sending}
                      onClick={recording ? stopRecording : startRecording}
                      type="button"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-brand-primary">
                        {recording ? <Square size={16} strokeWidth={1.5} /> : <Mic size={16} strokeWidth={1.5} />}
                      </span>
                      <span>
                        <span className="block text-[13px] font-medium">{recording ? 'Stop recording' : 'Recording'}</span>
                        <span className="block text-[12px] text-text-secondary">Create a voice note</span>
                      </span>
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {onCreatePoll ? (
              <button
                className="group relative flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border-default text-text-secondary transition hover:border-brand-primary hover:bg-brand-subtle hover:text-brand-primary"
                onClick={() => {
                  setPollOpen((current) => !current);
                  setAddonsOpen(false);
                  setStickersOpen(false);
                }}
                type="button"
              >
                <Vote size={16} strokeWidth={1.5} />
                <span className="pointer-events-none absolute bottom-[calc(100%+10px)] right-0 hidden whitespace-nowrap rounded-full border border-border-default bg-white px-3 py-1 text-[12px] font-medium text-text-primary shadow-card group-hover:block">
                  Create poll
                </span>
              </button>
            ) : null}

            <div className="relative">
              <button
                className={`group relative flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border-default transition hover:border-brand-primary hover:bg-brand-subtle hover:text-brand-primary ${
                  stickersOpen ? 'border-brand-primary bg-brand-subtle text-brand-primary' : 'text-text-secondary'
                }`}
                disabled={disabled || uploading || sending}
                onClick={() => {
                  setStickersOpen((current) => !current);
                  setAddonsOpen(false);
                  setStickersTab('stickers');
                }}
                ref={stickersButtonRef}
                type="button"
              >
                <Smile size={16} strokeWidth={1.5} />
                <span className="pointer-events-none absolute bottom-[calc(100%+10px)] right-0 hidden whitespace-nowrap rounded-full border border-border-default bg-white px-3 py-1 text-[12px] font-medium text-text-primary shadow-card group-hover:block">
                  Emojis & GIFs
                </span>
              </button>
              <ChatEmojiGifPicker
                anchorEl={stickersButtonRef.current}
                onGifSelect={sendGif}
                onClose={() => setStickersOpen(false)}
                onStickerSelect={sendSticker}
                open={stickersOpen}
                tab={stickersTab}
                triggerEl={stickersButtonRef.current}
                onTabChange={setStickersTab}
              />
            </div>

            <button
              className="flex min-h-11 items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-[14px] font-medium text-white transition hover:bg-brand-hover active:scale-95 active:bg-brand-pressed disabled:cursor-not-allowed disabled:bg-border-default disabled:text-text-secondary"
              disabled={disabled || uploading || sending}
              onClick={submit}
              type="button"
            >
              {uploading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
              ) : (
                <SendHorizontal size={16} strokeWidth={1.5} />
              )}
              <span>{uploading ? 'Uploading' : 'Send'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
