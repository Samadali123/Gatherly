import { DEFAULT_PROFILE_IMAGE, resolveMediaUrl } from '../utils/mediaUrl';

const initialsFromName = (name = '') => {
  const compact = String(name || '').replace(/[^a-zA-Z0-9]/g, '');
  if (compact) {
    return compact.slice(0, 2).toUpperCase();
  }

  return 'GA';
};

export default function Avatar({ name, src, size = 'md' }) {
  const imageSrc = resolveMediaUrl(src || DEFAULT_PROFILE_IMAGE);
  const sizeMap = {
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-28 w-28 text-2xl',
  };

  return (
    <div className="relative flex shrink-0 items-center justify-center leading-none">
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={name || 'Avatar'}
          className={`${sizeMap[size]} block rounded-full border border-border-default object-cover shadow-card`}
          onError={(event) => {
            const fallbackSrc = resolveMediaUrl(DEFAULT_PROFILE_IMAGE);
            if (event.currentTarget.src !== fallbackSrc) {
              event.currentTarget.src = fallbackSrc;
            }
          }}
        />
      ) : (
        <div
          className={`${sizeMap[size]} flex items-center justify-center rounded-full border border-border-default bg-brand-subtle font-medium text-brand-primary shadow-card`}
        >
          {initialsFromName(name)}
        </div>
      )}
    </div>
  );
}
