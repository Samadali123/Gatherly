import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

export default function Modal({ open, onClose, title, children, variant = 'modal' }) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const isDrawer = variant === 'drawer-right';

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-[rgba(36,81,67,0.48)] backdrop-blur-[4px]',
        isDrawer ? 'flex items-stretch justify-end p-0' : 'flex items-end justify-center p-3 sm:items-center sm:p-4'
      )}
    >
      <button aria-label="Close modal" className="absolute inset-0" onClick={onClose} type="button" />
      <div
        className={cn(
          'relative z-10 border border-border-default bg-bg-primary shadow-[0_16px_50px_rgba(36,81,67,0.18)]',
          isDrawer
            ? 'flex h-full w-full max-w-[460px] flex-col rounded-none sm:rounded-l-xl'
            : 'w-full max-w-md rounded-xl p-6'
        )}
      >
        {title ? (
          <div className={cn('flex items-center justify-between gap-3', isDrawer ? 'border-b border-border-default px-5 py-4' : '')}>
            <h2 className="font-display text-[20px] font-medium leading-[1.35] text-text-primary">{title}</h2>
            <button
              aria-label="Close"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-default bg-white text-text-secondary transition hover:border-brand-primary hover:bg-brand-subtle hover:text-brand-primary"
              onClick={onClose}
              type="button"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
        ) : null}
        <div className={cn(isDrawer ? 'min-h-0 flex-1 overflow-hidden p-3 sm:p-5' : title ? 'mt-4' : '')}>{children}</div>
      </div>
    </div>
  );
}
