import { useMemo, useState } from 'react';
import Modal from '../../../shared/components/Modal';
import ButtonSpinner from '../../../shared/components/ButtonSpinner';

const avatarColors = ['#245143', '#2563eb', '#7c3aed', '#c2410c', '#0f766e'];

export default function JoinRoomModal({ errorMessage, loading, open, passwordRequired, onCancel, onJoin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const preview = useMemo(() => {
    const number = Math.floor(100 + Math.random() * 900);
    return {
      alias: `Guest-${number}`,
      color: avatarColors[number % avatarColors.length],
    };
  }, [open]);

  const submit = () => {
    if (passwordRequired && !password.trim()) {
      setError('Please enter the room password.');
      return;
    }

    setError('');
    onJoin(password);
  };

  return (
    <Modal open={open} onClose={onCancel} title="Enter anonymous room">
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-border-default bg-brand-subtle p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-semibold text-white" style={{ backgroundColor: preview.color }}>
            {preview.alias.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-text-secondary">Anonymous preview</p>
            <p className="mt-1 truncate font-display text-[20px] font-medium leading-[1.35] text-text-primary">{preview.alias}</p>
          </div>
        </div>
        {error || errorMessage ? (
          <div className="rounded-xl border border-brand-primary bg-brand-subtle px-4 py-3 text-[13px] leading-[1.5] text-text-primary">
            {error || errorMessage}
          </div>
        ) : null}
        {passwordRequired ? (
          <>
            <input
              autoComplete="current-password"
              className="w-full rounded-xl border border-border-default bg-white px-4 py-3 text-[14px] text-text-primary"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Room password"
              type="password"
              value={password}
            />
          </>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <button
            className="min-h-11 rounded-full border border-border-default bg-white px-4 py-3 text-[14px] font-medium text-text-secondary transition hover:border-brand-primary hover:text-brand-primary"
            disabled={loading}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="min-h-11 rounded-full bg-brand-primary px-4 py-3 text-[14px] font-medium text-white transition hover:bg-brand-hover active:scale-95 active:bg-brand-pressed disabled:bg-border-default disabled:text-text-secondary"
            disabled={loading}
            onClick={submit}
            type="button"
          >
            <span className="inline-flex items-center justify-center gap-2">
              {loading ? <ButtonSpinner /> : null}
              Enter room
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
