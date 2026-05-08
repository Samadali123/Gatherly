import OnlineDot from './OnlineDot';

const initialsFromName = (name = '') =>
  name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join('') || 'G';

export default function Avatar({ name, src, online = false, size = 'md' }) {
  const sizeMap = {
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-14 w-14 text-base',
  };

  return (
    <div className="relative inline-flex shrink-0">
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className={`${sizeMap[size]} rounded-full border border-border-default object-cover shadow-card`}
        />
      ) : (
        <div
          className={`${sizeMap[size]} flex items-center justify-center rounded-full border border-border-default bg-brand-subtle font-medium text-brand-primary shadow-card`}
        >
          {initialsFromName(name)}
        </div>
      )}
      <div className="absolute -bottom-0.5 -right-0.5">
        <OnlineDot online={online} />
      </div>
    </div>
  );
}
