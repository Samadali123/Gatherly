export default function PinnedBanner({ message, onViewAll }) {
  if (!message) {
    return null;
  }

  return (
    <div className="animate-rise border-b border-border-default bg-white px-4 py-3 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[0.25em] text-brand-primary">Pinned message</p>
          <p className="truncate text-[15px] font-medium text-text-primary">{message.msg}</p>
        </div>
        <button className="min-h-11 rounded-full border border-border-default px-3 py-2 text-[12px] font-medium uppercase tracking-[0.18em] text-text-secondary" onClick={onViewAll} type="button">
          View all
        </button>
      </div>
    </div>
  );
}
