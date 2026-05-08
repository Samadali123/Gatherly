import { Image, Palette, Plus, SendHorizontal, Video } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import api from '../../../services/api';
import Avatar from '../../../shared/components/Avatar';
import ButtonSpinner from '../../../shared/components/ButtonSpinner';
import { useUiStore } from '../../chat/chatStore';
import StatusViewer from '../components/StatusViewer';

const fontOptions = [
  { label: 'Default', value: '"DM Sans", system-ui, sans-serif' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Mono', value: '"Courier New", monospace' },
  { label: 'Cursive', value: 'cursive' },
  { label: 'Pacifico', value: '"Pacifico", cursive' },
  { label: 'Dancing Script', value: '"Dancing Script", cursive' },
  { label: 'Playfair', value: '"Playfair Display", serif' },
];

const groupByUser = (statuses) => {
  const grouped = new Map();
  statuses.forEach((status) => {
    const id = status.userId?._id || status.userId?.id || status.userId?.username;
    if (!id) return;

    const existing = grouped.get(id) || { user: status.userId, statuses: [] };
    existing.statuses.push(status);
    grouped.set(id, existing);
  });
  return Array.from(grouped.values());
};

export default function StatusPage() {
  const { pushToast } = useUiStore();
  const imageRef = useRef(null);
  const videoRef = useRef(null);
  const colorPickerRef = useRef(null);
  const [mine, setMine] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [viewer, setViewer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeColorPicker, setActiveColorPicker] = useState(null);
  const [draft, setDraft] = useState({
    type: 'text',
    text: '',
    mediaUrl: '',
    style: {
      background: '#245143',
      color: '#FFFFFF',
      align: 'center',
      fontSize: 30,
      bold: false,
      italic: false,
      fontFamily: fontOptions[0].value,
    },
  });
  const [composerMode, setComposerMode] = useState('text');

  const updateGroups = useMemo(() => groupByUser(updates), [updates]);
  const allStoryGroups = useMemo(
    () => [
      ...(mine.length ? [{ user: mine[0].userId, statuses: mine, canReply: false }] : []),
      ...updateGroups.map((group) => ({ ...group, canReply: true })),
    ],
    [mine, updateGroups]
  );

  const loadStatuses = async () => {
    const response = await api.get('/statuses');
    setMine(response.data.data?.mine || []);
    setUpdates(response.data.data?.updates || []);
  };

  useEffect(() => {
    loadStatuses().catch(() => pushToast('Unable to load statuses', 'error'));
  }, [pushToast]);

  useEffect(() => {
    if (!activeColorPicker) return undefined;

    const handleOutsideClick = (event) => {
      if (!colorPickerRef.current?.contains(event.target)) {
        setActiveColorPicker(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activeColorPicker]);

  const uploadMedia = async (type, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('type', type);
    formData.append('files', file);
    const response = await api.post('/statuses/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setComposerMode('media');
    setDraft((current) => ({ ...current, type, mediaUrl: response.data.data.url }));
  };

  const createStatus = async () => {
    setLoading(true);
    try {
      await api.post('/statuses', draft);
      setDraft((current) => ({ ...current, type: 'text', text: '', mediaUrl: '' }));
      setComposerMode('text');
      await loadStatuses();
      pushToast('Status posted', 'success');
    } catch (error) {
      pushToast(error.response?.data?.message || 'Unable to post status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const reply = async (statusId, text) => {
    await api.post(`/statuses/${statusId}/replies`, { text });
    pushToast('Reply sent to chat', 'success');
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-8 xl:grid-cols-[360px_minmax(0,1fr)]">
      <section className="rounded-xl border border-border-default bg-bg-primary p-4 shadow-card sm:p-5">
          <p className="text-[12px] font-medium uppercase tracking-[0.24em] text-text-secondary">Status studio</p>
          <h2 className="mt-2 font-display text-[26px] font-medium text-text-primary">Add to my status</h2>

        <button
          className="mt-5 flex w-full items-center gap-3 rounded-xl border border-border-default bg-bg-secondary px-4 py-3 text-left transition hover:bg-brand-subtle"
          onClick={() => mine.length ? setViewer({ groups: allStoryGroups }) : null}
          type="button"
        >
          <div className={`rounded-full p-1 ${mine.length ? 'bg-brand-primary' : 'bg-border-default'}`}>
            <Avatar name="Me" src={mine[0]?.userId?.avatar || mine[0]?.userId?.profileImage} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-text-primary">{mine.length ? 'View my status' : 'No status yet'}</p>
            <p className="text-[12px] text-text-secondary">{mine.length ? `${mine.length} update${mine.length > 1 ? 's' : ''}` : 'Create photo, video, or text status'}</p>
          </div>
          <Plus size={18} strokeWidth={1.5} />
        </button>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-border-default bg-bg-secondary p-2">
          <button
            className={`min-h-11 rounded-lg text-[13px] font-medium ${composerMode === 'text' ? 'bg-brand-primary text-white' : 'bg-white text-text-secondary'}`}
            onClick={() => {
              setComposerMode('text');
              setDraft((current) => ({ ...current, type: 'text', mediaUrl: '' }));
            }}
            type="button"
          >
            Text canvas
          </button>
          <button
            className={`min-h-11 rounded-lg text-[13px] font-medium ${composerMode === 'media' ? 'bg-brand-primary text-white' : 'bg-white text-text-secondary'}`}
            onClick={() => setComposerMode('media')}
            type="button"
          >
            Photo or video
          </button>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-border-default">
          {draft.type === 'image' && draft.mediaUrl ? <img alt="Status preview" className="h-[min(62vh,420px)] min-h-[300px] w-full object-cover" src={draft.mediaUrl} /> : null}
          {draft.type === 'video' && draft.mediaUrl ? <video className="h-[min(62vh,420px)] min-h-[300px] w-full bg-brand-primary object-contain" controls src={draft.mediaUrl} /> : null}
          {draft.type === 'text' ? (
            <div
              className="flex h-[min(62vh,420px)] min-h-[300px] items-center justify-center p-5 text-center sm:p-6"
              style={{
                background: draft.style.background,
                color: draft.style.color,
                fontSize: draft.style.fontSize,
                fontWeight: draft.style.bold ? 700 : 500,
                fontStyle: draft.style.italic ? 'italic' : 'normal',
                fontFamily: draft.style.fontFamily || fontOptions[0].value,
                textAlign: draft.style.align,
              }}
            >
              {draft.text || 'Write your status'}
            </div>
          ) : null}
        </div>

        <label className="mt-4 block space-y-2">
          <span className="text-[14px] font-medium text-text-primary">{composerMode === 'text' ? 'Write your status' : 'Add a caption'}</span>
          <textarea
            className="min-h-[100px] w-full resize-none rounded-xl border border-border-default bg-white px-4 py-3 text-[14px] text-text-primary"
            onChange={(event) => setDraft((current) => ({ ...current, text: event.target.value, type: current.mediaUrl ? current.type : 'text' }))}
            placeholder={composerMode === 'text' ? 'Share an update, note, or announcement' : 'Optional caption for this media'}
            style={composerMode === 'text' ? { fontFamily: draft.style.fontFamily || fontOptions[0].value } : undefined}
            value={draft.text}
          />
        </label>

        {composerMode === 'text' ? (
        <div className="mt-3 space-y-3">
          <div className="relative flex flex-wrap items-center gap-4" ref={colorPickerRef}>
            <button
              aria-label="Choose status background color"
              className="inline-flex items-center gap-3 text-left"
              onClick={() => setActiveColorPicker((current) => (current === 'background' ? null : 'background'))}
              type="button"
            >
              <span
                className="h-10 w-10 rounded-full border border-border-default shadow-sm transition hover:scale-105"
                style={{ background: draft.style.background || '#FFFFFF' }}
              />
              <span className="inline-flex items-center gap-2 text-[13px] font-medium text-text-secondary">
                <Palette size={15} strokeWidth={1.6} />
                Background color
              </span>
            </button>

            <button
              aria-label="Choose status text color"
              className="inline-flex items-center gap-3 text-left"
              onClick={() => setActiveColorPicker((current) => (current === 'text' ? null : 'text'))}
              type="button"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border-default bg-white text-[16px] font-semibold shadow-sm transition hover:scale-105"
                style={{ color: draft.style.color || '#FFFFFF' }}
              >
                Aa
              </span>
              <span className="inline-flex items-center gap-2 text-[13px] font-medium text-text-secondary">
                <Palette size={15} strokeWidth={1.6} />
                Text color
              </span>
            </button>

            {activeColorPicker ? (
              <div className="absolute left-0 top-12 z-20 rounded-xl border border-border-default bg-bg-primary p-3 shadow-[0_18px_48px_rgba(36,81,67,0.18)]">
                <HexColorPicker
                  color={activeColorPicker === 'background' ? draft.style.background || '#FFFFFF' : draft.style.color || '#FFFFFF'}
                  onChange={(color) => setDraft((current) => ({
                    ...current,
                    type: 'text',
                    mediaUrl: '',
                    style: { ...current.style, [activeColorPicker === 'background' ? 'background' : 'color']: color },
                  }))}
                />
                <input
                  className="mt-3 h-9 w-full rounded-lg border border-border-default bg-white px-3 text-[13px] text-text-primary"
                  onChange={(event) => setDraft((current) => ({
                    ...current,
                    type: 'text',
                    mediaUrl: '',
                    style: { ...current.style, [activeColorPicker === 'background' ? 'background' : 'color']: event.target.value },
                  }))}
                  value={activeColorPicker === 'background' ? draft.style.background || '#FFFFFF' : draft.style.color || '#FFFFFF'}
                />
              </div>
            ) : null}
          </div>

          <div className="scrollbar-chat flex gap-2 overflow-x-auto pb-1">
            {fontOptions.map((font) => {
              const selected = (draft.style.fontFamily || fontOptions[0].value) === font.value;
              return (
                <button
                  className={`shrink-0 rounded-full border px-4 py-2 text-[14px] transition ${
                    selected ? 'border-brand-primary bg-brand-subtle text-brand-primary' : 'border-border-default bg-white text-text-secondary hover:bg-bg-secondary'
                  }`}
                  key={font.value}
                  onClick={() => setDraft((current) => ({ ...current, type: 'text', mediaUrl: '', style: { ...current.style, fontFamily: font.value } }))}
                  style={{ fontFamily: font.value }}
                  type="button"
                >
                  Aa {font.label}
                </button>
              );
            })}
          </div>
        </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-default bg-white px-4 text-[14px]" onClick={() => imageRef.current?.click()} type="button"><Image size={16} /> Choose photo</button>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-default bg-white px-4 text-[14px]" onClick={() => videoRef.current?.click()} type="button"><Video size={16} /> Choose video</button>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <input accept="image/*" className="hidden" onChange={(event) => uploadMedia('image', event.target.files?.[0])} ref={imageRef} type="file" />
          <input accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(event) => uploadMedia('video', event.target.files?.[0])} ref={videoRef} type="file" />
          <button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-primary px-5 text-[14px] font-medium text-white" disabled={loading} onClick={createStatus} type="button">
            {loading ? <ButtonSpinner /> : <SendHorizontal size={16} />} Add status
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-border-default bg-bg-primary p-4 shadow-card sm:p-5">
        <p className="text-[12px] font-medium uppercase tracking-[0.24em] text-text-secondary">Recent updates</p>
        <div className="mt-4 space-y-3">
          {updateGroups.map((group) => (
            <button
              className="flex w-full items-center gap-3 rounded-xl border border-border-default bg-bg-secondary px-4 py-3 text-left transition hover:bg-brand-subtle"
              key={group.user?._id || group.user?.username}
              onClick={() => {
                const start = allStoryGroups.findIndex((entry) => (entry.user?._id || entry.user?.username) === (group.user?._id || group.user?.username));
                setViewer({ groups: start > 0 ? [...allStoryGroups.slice(start), ...allStoryGroups.slice(0, start)] : allStoryGroups });
              }}
              type="button"
            >
              <div className="rounded-full bg-brand-primary p-1">
                <Avatar name={group.user?.name || group.user?.username} src={group.user?.avatar || group.user?.profileImage} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-text-primary">{group.user?.name || group.user?.username}</p>
                <p className="text-[12px] text-text-secondary">{group.statuses.length} update{group.statuses.length > 1 ? 's' : ''}</p>
              </div>
            </button>
          ))}
          {!updateGroups.length ? (
            <p className="rounded-xl border border-dashed border-border-default px-4 py-8 text-center text-[14px] text-text-secondary">
              Status updates from one-to-one chats will appear here.
            </p>
          ) : null}
        </div>
      </section>

      {viewer ? (
        <StatusViewer
          canReply={viewer.canReply}
          groups={viewer.groups}
          onClose={() => setViewer(null)}
          onReply={reply}
          statuses={viewer.statuses}
          user={viewer.user}
        />
      ) : null}
    </div>
  );
}
