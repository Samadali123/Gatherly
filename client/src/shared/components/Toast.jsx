import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const styles = {
  success: 'border-[#b8d8c8] bg-[#f4fbf4] text-text-primary',
  error: 'border-[#f2cec1] bg-[#fff4ef] text-text-primary',
  info: 'border-[#b9d8ce] bg-bg-primary text-text-primary',
};

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => onDismiss(toast.id), toast.duration ?? 4000);
    return () => window.clearTimeout(timeout);
  }, [onDismiss, toast]);

  if (!toast) {
    return null;
  }

  const Icon = icons[toast.variant || 'info'];

  return (
    <div
      className={`animate-rise overflow-hidden rounded-xl border text-[14px] leading-[1.6] shadow-[0_18px_50px_rgba(23,35,32,0.14)] ${styles[toast.variant || 'info']}`}
      role="status"
    >
      <div className="h-1 bg-brand-primary" />
      <div className="flex items-start gap-3 px-4 py-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-brand-primary">
          <Icon size={17} strokeWidth={1.7} />
        </span>
        <div className="min-w-0 flex-1">
          {toast.title ? <div className="font-medium">{toast.title}</div> : null}
          <div>{toast.message}</div>
        </div>
        <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-brand-subtle hover:text-brand-primary" onClick={() => onDismiss(toast.id)} type="button">
          <X size={15} strokeWidth={1.7} />
        </button>
      </div>
    </div>
  );
}
