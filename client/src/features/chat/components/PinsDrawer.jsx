import Modal from '../../../shared/components/Modal';
import { formatDate } from '../../../shared/utils/formatDate';

const PinPreview = ({ pin }) => {
  const attachments = pin.attachments || [];
  const image = attachments.find((attachment) => attachment.type === 'image');
  const gif = attachments.find((attachment) => attachment.type === 'gif');
  const video = attachments.find((attachment) => attachment.type === 'video');
  const audio = attachments.find((attachment) => attachment.type === 'audio');
  const document = attachments.find((attachment) => attachment.type === 'document');

  if (pin.msg) {
    return <p className="text-[14px] leading-[1.6] text-text-primary">{pin.msg}</p>;
  }

  if (gif) {
    return <img alt="Pinned GIF" className="max-h-52 w-full rounded-lg object-cover" src={gif.gifUrl || gif.previewUrl || gif.url} />;
  }

  if (image) {
    return <img alt="Pinned image" className="max-h-52 w-full rounded-lg object-cover" src={image.url} />;
  }

  if (video) {
    return <video className="max-h-52 w-full rounded-lg bg-black object-contain" controls src={video.url} />;
  }

  if (audio) {
    return <audio className="w-full" controls src={audio.url} />;
  }

  if (document) {
    return <p className="text-[14px] leading-[1.6] text-text-primary">Pinned document</p>;
  }

  return <p className="text-[14px] leading-[1.6] text-text-secondary">Pinned attachment</p>;
};

export default function PinsDrawer({ canUnpin = () => true, open, onClose, pins, onUnpin }) {
  return (
    <Modal open={open} onClose={onClose} title="Pinned Messages" variant="drawer-right">
      <div className="scrollbar-chat h-full min-h-0 space-y-3 overflow-y-auto pr-1">
        {!pins.length ? (
          <div className="rounded-xl border border-dashed border-border-default px-4 py-8 text-center text-[14px] text-text-secondary">
            No pinned messages yet.
          </div>
        ) : null}
        {pins.map((pin) => (
          <div className="rounded-xl border border-border-default bg-bg-secondary p-4 shadow-card" key={pin._id}>
            <PinPreview pin={pin} />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[12px] text-text-secondary">{formatDate(pin.createdAt)}</span>
              {canUnpin(pin) ? (
                <button className="min-h-11 rounded-full border border-border-default px-3 py-1.5 text-[12px] font-medium uppercase tracking-[0.16em] text-text-secondary" onClick={() => onUnpin(pin)} type="button">
                  Unpin
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
