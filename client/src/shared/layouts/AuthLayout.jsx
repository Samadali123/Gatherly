import { Outlet, useLocation } from 'react-router-dom';
import { useUiStore } from '../../features/chat/chatStore';
import Toast from '../components/Toast';

export default function AuthLayout() {
  const { toasts, dismissToast } = useUiStore();
  const location = useLocation();
  const isPasswordFlow = location.pathname === '/forgot-password' || location.pathname === '/reset-password';

  if (isPasswordFlow) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg-secondary px-3 py-8 sm:px-6">
        <section className="w-full max-w-md rounded-xl border border-border-default bg-bg-primary p-5 shadow-card sm:p-6">
          <Outlet />
        </section>
        <div className="pointer-events-none fixed inset-x-3 top-3 z-50 flex flex-col gap-3 sm:left-auto sm:right-4 sm:w-full sm:max-w-sm">
          {toasts.map((toast) => (
            <div className="pointer-events-auto" key={toast.id}>
              <Toast onDismiss={dismissToast} toast={toast} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg-secondary px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100dvh-24px)] w-full max-w-6xl overflow-hidden rounded-xl border border-border-default bg-bg-primary shadow-card sm:min-h-[calc(100dvh-48px)] lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <section className="relative flex min-h-[300px] flex-col justify-between overflow-hidden bg-[#245143] p-5 text-white sm:min-h-[360px] sm:p-8 lg:min-h-full lg:p-10">
          <div className="relative z-10">
            <p className="text-[12px] font-medium uppercase tracking-[0.3em] text-white/70">Gatherly</p>
            <h1 className="mt-4 max-w-xl font-display text-[28px] font-medium leading-[1.15] sm:text-[42px]">
              Conversations that feel organized before they get busy.
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-[1.7] text-white/76">
              Message your team, open anonymous rooms, pin decisions, and keep replies where the context belongs.
            </p>
          </div>

          <div className="relative z-10 mt-8 grid gap-4 sm:grid-cols-[1fr_0.8fr] lg:mt-12">
            <div className="rounded-lg border border-white/12 bg-white/10 p-4 shadow-[0_20px_50px_rgba(36,81,67,0.28)] backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-white/58">Today</p>
                  <p className="mt-1 text-[15px] font-medium">Project room</p>
                </div>
                <span className="rounded-full bg-white/14 px-3 py-1 text-[12px] text-white/80">Live</span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="max-w-[82%] rounded-lg bg-white px-3 py-2 text-[13px] leading-[1.5] text-text-primary">
                  Final copy is pinned. Launch notes are ready.
                </div>
                <div className="ml-auto max-w-[78%] rounded-lg bg-[#DDF4E8] px-3 py-2 text-[13px] leading-[1.5] text-[#245143]">
                  Perfect. I added the reply thread for follow-ups.
                </div>
                <div className="flex items-center gap-2 text-[12px] text-white/70">
                  <span className="h-2 w-2 rounded-full bg-[#34D399]" />
                  4 people active
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/12 bg-white/10 p-4 backdrop-blur">
              <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-white/58">Pinned</p>
              <p className="mt-3 text-[15px] leading-[1.55] text-white/88">
                Decisions stay visible, replies stay attached, and rooms close on your schedule.
              </p>
              <div className="mt-5 flex gap-2">
                <span className="rounded-full bg-white/14 px-3 py-1 text-[12px] text-white/80">Pins</span>
                <span className="rounded-full bg-white/14 px-3 py-1 text-[12px] text-white/80">Rooms</span>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-4 sm:p-8 lg:p-10">
          <div className="w-full max-w-md rounded-xl border border-border-default bg-bg-primary p-4 shadow-card sm:p-6">
            <Outlet />
          </div>
        </section>
      </div>
      <div className="pointer-events-none fixed inset-x-3 top-3 z-50 flex flex-col gap-3 sm:left-auto sm:right-4 sm:w-full sm:max-w-sm">
        {toasts.map((toast) => (
          <div className="pointer-events-auto" key={toast.id}>
            <Toast onDismiss={dismissToast} toast={toast} />
          </div>
        ))}
      </div>
    </div>
  );
}
