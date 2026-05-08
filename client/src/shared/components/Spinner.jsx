export default function Spinner({ label = '', size = 'md' }) {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-5 w-5';

  return (
    <div className="inline-flex items-center justify-center gap-3 text-[14px] leading-[1.6] text-text-secondary">
      <span
        aria-label={label || 'Loading'}
        className={`${sizeClass} animate-spin rounded-full border-2 border-brand-primary/25 border-t-brand-primary`}
        role="status"
      />
      {label ? <span>{label}</span> : null}
    </div>
  );
}
