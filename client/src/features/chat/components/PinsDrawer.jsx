import Modal from '../../../shared/components/Modal';
import { formatDate } from '../../../shared/utils/formatDate';

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
            <p className="text-[14px] leading-[1.6] text-text-primary">{pin.msg}</p>
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
