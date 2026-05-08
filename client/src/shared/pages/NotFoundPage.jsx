import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen min-h-dvh items-center justify-center bg-bg-primary px-6 py-16 text-center sm:px-8">
      <section className="flex w-full max-w-[560px] flex-col items-center">
        <div className="relative mb-10 flex h-24 w-24 items-center justify-center text-brand-primary sm:mb-12 sm:h-28 sm:w-28">
          <span className="absolute inset-0 rounded-full border border-border-default/70" />
          <span className="absolute h-16 w-16 rounded-full border border-dashed border-brand-primary/35 motion-safe:animate-pulse sm:h-20 sm:w-20" />
          <svg
            aria-hidden="true"
            className="relative h-14 w-14 sm:h-16 sm:w-16"
            fill="none"
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M25.5 38.5 20 44a10 10 0 0 1-14.1-14.1l8-8A10 10 0 0 1 28 21.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
            <path
              d="m38.5 25.5 5.6-5.6A10 10 0 0 1 58.2 34l-8 8A10 10 0 0 1 36 42.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
            <path d="m26 26 12 12" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
            <path d="m38 26-12 12" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
          </svg>
        </div>

        <p className="font-display text-[72px] font-light leading-none text-text-primary sm:text-[104px] lg:text-[112px]">
          404
        </p>
        <h1 className="mt-8 font-display text-[24px] font-medium leading-tight text-text-primary">Page not found</h1>
        <p className="mt-4 max-w-[420px] text-[15px] leading-[1.7] text-text-secondary">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          className="mt-10 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-[14px] font-medium text-white transition hover:bg-brand-hover active:scale-95 active:bg-brand-pressed"
          to="/"
        >
          <Home size={16} strokeWidth={1.5} />
          Go to Home
        </Link>
      </section>
    </main>
  );
}
