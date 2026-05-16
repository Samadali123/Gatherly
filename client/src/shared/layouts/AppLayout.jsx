import { Link, Outlet, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useUiStore } from '../../features/chat/chatStore';
import Toast from '../components/Toast';

export default function AppLayout() {
  const { toasts, dismissToast } = useUiStore();
  const { logout } = useAuth();
  const location = useLocation();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const navItems = [
    { label: 'Chat', to: '/chat' },
    { label: 'Rooms', to: '/rooms/new' },
    { label: 'Status', to: '/status' },
    { label: 'Notifications', to: '/settings/notifications' },
  ];

  return (
    <div className="h-dvh overflow-hidden bg-transparent">
      <div className="flex h-dvh w-full">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border-default bg-bg-primary px-3 py-3 sm:px-5 md:px-7">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-[12px] font-medium uppercase tracking-[0.28em] text-text-secondary">Gatherly</p>
                <h1 className="truncate font-display text-[18px] font-medium leading-[1.35] text-text-primary sm:text-[20px]">Chat warmly. Meet freely.</h1>
              </div>
              <nav className="scrollbar-chat -mx-1 flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:pb-0">
                {navItems.map((item) => {
                  const active = location.pathname === item.to;

                  return (
                    <Link
                      className={`rounded-full border px-4 py-2 text-[13px] font-medium transition ${
                        active
                          ? 'border-brand-primary bg-brand-subtle text-brand-primary'
                          : 'border-border-default bg-white text-text-secondary hover:border-brand-primary hover:text-brand-primary'
                      }`}
                      key={item.to}
                      to={item.to}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                <button
                  className="flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-full border border-border-default bg-bg-primary text-text-secondary transition hover:border-brand-primary hover:text-brand-primary sm:min-h-11 sm:min-w-11"
                  onClick={() => setLogoutConfirmOpen(true)}
                  type="button"
                >
                  <LogOut size={16} strokeWidth={1.7} />
                </button>
              </nav>
            </div>
          </header>

          <main className="scrollbar-chat min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <Outlet />
          </main>
        </div>

        {logoutConfirmOpen ? (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-sm rounded-xl border border-border-default bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
              <h2 className="font-display text-[22px] font-medium text-text-primary">Are you sure you want to logout?</h2>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  className="min-h-11 rounded-full border border-border-default px-5 text-[14px] font-medium text-text-secondary"
                  onClick={() => setLogoutConfirmOpen(false)}
                  type="button"
                >
                  No
                </button>
                <button
                  className="min-h-11 rounded-full bg-brand-primary px-5 text-[14px] font-medium text-white"
                  onClick={logout}
                  type="button"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="pointer-events-none fixed inset-x-3 top-3 z-50 flex flex-col gap-3 sm:left-auto sm:right-4 sm:top-20 sm:w-full sm:max-w-sm">
          {toasts.map((toast) => (
            <div className="pointer-events-auto" key={toast.id}>
              <Toast onDismiss={dismissToast} toast={toast} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
