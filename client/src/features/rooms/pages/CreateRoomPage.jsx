import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { storeAnonRoomSession } from '../../../services/api';
import { connectSocket, socket } from '../../../services/socket';
import ButtonSpinner from '../../../shared/components/ButtonSpinner';
import { getFriendlyErrorMessage } from '../../../shared/utils/errorMessage';
import { useUiStore } from '../../chat/chatStore';
import { useAuthStore } from '../../auth/authStore';

const toDatetimeLocalValue = (date) => {
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const minutesFromNow = (minutes) => toDatetimeLocalValue(new Date(Date.now() + minutes * 60 * 1000));

export default function CreateRoomPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { pushToast } = useUiStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    expiresAt: minutesFromNow(5),
    password: '',
    maxParticipants: 10,
  });
  const [query, setQuery] = useState('');
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await api.get(`/rooms?q=${encodeURIComponent(query)}`);
        setRooms(response.data.data || []);
      } catch {
        setRooms([]);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    if (accessToken && !socket.connected) {
      connectSocket(accessToken).catch(() => {});
    }

    const handleRoomCreated = (room) => {
      setRooms((current) => {
        if (query.trim()) {
          const lowerQuery = query.trim().toLowerCase();
          const matches = [room.code, room.name].filter(Boolean).some((value) => value.toLowerCase().includes(lowerQuery));
          if (!matches) return current;
        }

        const withoutDuplicate = current.filter((entry) => entry.code !== room.code);
        return [room, ...withoutDuplicate].slice(0, 25);
      });
    };

    socket.on('room:created', handleRoomCreated);
    return () => socket.off('room:created', handleRoomCreated);
  }, [accessToken, query]);

  const submit = async (event) => {
    event.preventDefault();

    if (form.maxParticipants < 2 || form.maxParticipants > 10) {
      setError('Room limit must be between 2 and 10 participants.');
      return;
    }

    setLoading(true);

    try {
      setError('');
      const response = await api.post('/rooms', {
        ...form,
        expiresAt: new Date(form.expiresAt).toISOString(),
      });
      if (response.data.data?.session) {
        storeAnonRoomSession(response.data.data.code, response.data.data.session);
      }
      pushToast('Anonymous room created', 'success');
      navigate(`/room/${response.data.data.code}`);
    } catch (error) {
      const message = getFriendlyErrorMessage(error, 'Unable to create room. Please try again.');
      setError(message);
      pushToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-8 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div>
        <div className="rounded-xl border border-border-default bg-bg-primary p-4 shadow-card sm:p-8">
          <p className="text-[12px] font-medium uppercase tracking-[0.24em] text-text-secondary">Anonymous room</p>
          <h2 className="mt-3 font-display text-[28px] font-medium leading-[1.3] text-text-primary">Create a private room</h2>

          <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={submit}>
            {error ? (
              <div className="rounded-xl border border-brand-primary bg-brand-subtle px-4 py-3 text-[13px] leading-[1.5] text-text-primary md:col-span-2">
                {error}
              </div>
            ) : null}
            <label className="space-y-2 md:col-span-2">
              <span className="text-[14px] font-medium text-text-primary">Room name</span>
              <input
                className="w-full rounded-xl border border-border-default bg-white px-4 py-3 text-[14px] text-text-primary"
                maxLength={80}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Weekend planning, standup, secret notes..."
                value={form.name}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[14px] font-medium text-text-primary">Room closes at</span>
              <input
                className="w-full rounded-xl border border-border-default bg-white px-4 py-3 text-[14px] text-text-primary"
                min={toDatetimeLocalValue(new Date(Date.now() + 5 * 60 * 1000))}
                onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))}
                type="datetime-local"
                value={form.expiresAt}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[14px] font-medium text-text-primary">Max participants</span>
              <input
                className="w-full rounded-xl border border-border-default bg-white px-4 py-3 text-[14px] text-text-primary"
                min="2"
                max="10"
                onChange={(event) => setForm((current) => ({ ...current, maxParticipants: Math.min(10, Number(event.target.value)) }))}
                type="number"
                value={form.maxParticipants}
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-[14px] font-medium text-text-primary">Password</span>
              <input
                autoComplete="new-password"
                className="w-full rounded-xl border border-border-default bg-white px-4 py-3 text-[14px] text-text-primary"
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Optional password"
                type="password"
                value={form.password}
              />
            </label>

            <div className="md:col-span-2">
              <button
                className="min-h-11 rounded-full bg-brand-primary px-5 py-3 text-[14px] font-medium text-white transition hover:bg-brand-hover active:scale-95 active:bg-brand-pressed disabled:bg-border-default disabled:text-text-secondary"
                disabled={loading}
                type="submit"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {loading ? <ButtonSpinner /> : null}
                  Create room
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <aside className="rounded-xl border border-border-default bg-bg-primary p-5 shadow-card">
        <p className="text-[12px] font-medium uppercase tracking-[0.24em] text-text-secondary">Join anonymous room</p>
        <label className="mt-4 flex items-center gap-3 rounded-xl border border-border-default bg-white px-3 py-2">
          <Search className="text-text-secondary" size={16} strokeWidth={1.5} />
          <input
            className="min-h-11 min-w-0 flex-1 border-0 bg-transparent text-[14px] text-text-primary outline-none placeholder:text-text-secondary focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by room code"
            value={query}
          />
        </label>

        <div className="mt-4 space-y-3">
          {rooms.map((room) => {
            const isFull = room.participantCount >= room.maxParticipants;

            return (
              <div className="rounded-xl border border-border-default bg-bg-secondary p-4" key={room.code}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-medium text-text-primary">{room.name || room.code}</p>
                    <p className="mt-1 text-[12px] text-text-secondary">
                      {room.name ? `${room.code} - ` : ''}{room.participantCount}/{room.maxParticipants} joined
                    </p>
                  </div>
                  <span className="rounded-full border border-border-default bg-white px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary">
                    {room.requiresPassword ? 'Locked' : 'Open'}
                  </span>
                </div>
                <Link
                  className={`mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full px-4 text-[14px] font-medium ${
                    isFull
                      ? 'pointer-events-none bg-border-default text-text-secondary'
                      : 'bg-brand-primary text-white hover:bg-brand-hover'
                  }`}
                  to={`/room/${room.code}`}
                >
                  {isFull ? 'Room full' : 'Join room'}
                </Link>
              </div>
            );
          })}
          {!rooms.length ? (
            <p className="rounded-xl border border-dashed border-border-default px-4 py-6 text-center text-[14px] text-text-secondary">
              No active rooms found.
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
