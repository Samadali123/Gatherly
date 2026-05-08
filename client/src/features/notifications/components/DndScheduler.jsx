export default function DndScheduler({ value, onChange }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-2">
        <span className="text-[14px] font-medium text-text-primary">Starts</span>
        <input
          className="w-full rounded-xl border border-border-default bg-white px-4 py-3 text-[14px] text-text-primary"
          onChange={(event) => onChange({ ...value, from: event.target.value })}
          type="datetime-local"
          value={value.from || ''}
        />
      </label>
      <label className="space-y-2">
        <span className="text-[14px] font-medium text-text-primary">Ends</span>
        <input
          className="w-full rounded-xl border border-border-default bg-white px-4 py-3 text-[14px] text-text-primary"
          onChange={(event) => onChange({ ...value, to: event.target.value })}
          type="datetime-local"
          value={value.to || ''}
        />
      </label>
    </div>
  );
}
