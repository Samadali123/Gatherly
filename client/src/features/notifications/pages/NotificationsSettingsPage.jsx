import { useEffect, useState } from 'react';
import api from '../../../services/api';
import { useAuthStore } from '../../auth/authStore';
import { useUiStore } from '../../chat/chatStore';
import DndScheduler from '../components/DndScheduler';
import DndToggle from '../components/DndToggle';
import DndWhitelist from '../components/DndWhitelist';
import ButtonSpinner from '../../../shared/components/ButtonSpinner';
import { getFriendlyErrorMessage } from '../../../shared/utils/errorMessage';

export default function NotificationsSettingsPage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const { pushToast } = useUiStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    dndEnabled: false,
    dndPeriod: { from: '', to: '' },
    dndWhitelist: [],
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm({
      dndEnabled: Boolean(user.dndEnabled),
      dndPeriod: {
        from: user.dndPeriod?.from ? user.dndPeriod.from.slice(0, 16) : '',
        to: user.dndPeriod?.to ? user.dndPeriod.to.slice(0, 16) : '',
      },
      dndWhitelist: user.dndWhitelist || [],
    });
  }, [user]);

  const save = async () => {
    if (form.dndEnabled && (!form.dndPeriod.from || !form.dndPeriod.to)) {
      setError('Please choose both start and end time for DND.');
      return;
    }

    if (form.dndEnabled && new Date(form.dndPeriod.to) <= new Date(form.dndPeriod.from)) {
      setError('DND end time must be after the start time.');
      return;
    }

    setSaving(true);
    try {
      setError('');
      const payload = {
        dndEnabled: form.dndEnabled,
        dndPeriod: {
          from: form.dndPeriod.from ? new Date(form.dndPeriod.from).toISOString() : null,
          to: form.dndPeriod.to ? new Date(form.dndPeriod.to).toISOString() : null,
        },
        dndWhitelist: form.dndWhitelist.map((entry) => entry._id || entry.id || entry),
      };

      const response = await api.patch('/users/me/dnd', payload);
      setUser({ ...user, ...response.data.data });
      pushToast('Notification preferences updated', 'success');
    } catch (error) {
      const message = getFriendlyErrorMessage(error, 'Unable to update notification settings. Please try again.');
      setError(message);
      pushToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="rounded-xl border border-border-default bg-bg-primary p-6 shadow-card sm:p-8">
        <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-text-secondary">Notifications</p>
        <h2 className="mt-3 font-display text-[28px] font-medium leading-[1.3] tracking-[-0.01em] text-text-primary">Shape how Gatherly reaches you</h2>
        <div className="mt-8 space-y-6">
          <DndToggle checked={form.dndEnabled} onChange={(dndEnabled) => setForm((current) => ({ ...current, dndEnabled }))} />
          {form.dndEnabled ? (
            <>
              <DndScheduler onChange={(dndPeriod) => setForm((current) => ({ ...current, dndPeriod }))} value={form.dndPeriod} />
              <DndWhitelist onChange={(dndWhitelist) => setForm((current) => ({ ...current, dndWhitelist }))} selected={form.dndWhitelist} />
            </>
          ) : null}
          {error ? (
            <div className="rounded-xl border border-brand-primary bg-brand-subtle px-4 py-3 text-[13px] leading-[1.5] text-text-primary">
              {error}
            </div>
          ) : null}
          <button
            className="min-h-11 rounded-full bg-brand-primary px-5 py-3 text-[14px] font-medium text-white transition hover:bg-brand-hover active:scale-95 active:bg-brand-pressed disabled:bg-border-default disabled:text-text-secondary"
            disabled={saving}
            onClick={save}
            type="button"
          >
            <span className="inline-flex items-center justify-center gap-2">
              {saving ? <ButtonSpinner /> : null}
              Save preferences
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
