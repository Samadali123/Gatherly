export default function DndToggle({ checked, onChange }) {
  return (
    <button
      className={`flex w-full items-center justify-between rounded-xl border px-4 py-4 text-left ${
        checked ? 'border-brand-primary bg-brand-subtle' : 'border-border-default bg-bg-secondary'
      }`}
      onClick={() => onChange(!checked)}
      type="button"
    >
      <div>
        <p className="text-[14px] font-medium text-text-primary">Do not disturb</p>
        <p className="text-[14px] leading-[1.6] text-text-secondary">Pause selected people's message popups for a date range. Their messages arrive when you open them after DND is off.</p>
      </div>
      <span className="rounded-full bg-bg-primary px-3 py-1 text-[12px] font-medium uppercase tracking-[0.16em] text-text-secondary">{checked ? 'On' : 'Off'}</span>
    </button>
  );
}
