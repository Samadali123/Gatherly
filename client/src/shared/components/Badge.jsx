import { cn } from '../utils/cn';

export default function Badge({ children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-border-default bg-brand-subtle px-2.5 py-1 text-[12px] font-semibold leading-[1.5] text-brand-primary',
        className
      )}
    >
      {children}
    </span>
  );
}
