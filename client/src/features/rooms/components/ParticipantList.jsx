export default function ParticipantList({ currentSessionId, canKick, onKick, participants }) {
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.sessionId === currentSessionId) return -1;
    if (b.sessionId === currentSessionId) return 1;
    return new Date(a.joinedAt || 0) - new Date(b.joinedAt || 0);
  });

  return (
    <div className="space-y-3">
      {sortedParticipants.map((participant) => {
        const isMe = participant.sessionId === currentSessionId;
        const label = participant.alias || 'Anonymous guest';
        const avatarLabel = (participant.avatarAnimal || label).replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'G';

        return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border-default bg-bg-secondary px-4 py-3" key={participant.sessionId}>
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white shadow-card"
              style={{ backgroundColor: participant.avatarColor || '#245143' }}
            >
              {avatarLabel}
            </div>
            <div className="min-w-0">
            <p className="truncate text-[14px] font-medium text-text-primary">{isMe ? `Me (${label})` : label}</p>
            <p className="text-[12px] text-text-secondary">{participant.isOnline ? 'Online now' : 'Offline'}</p>
            </div>
          </div>
          {canKick && !isMe ? (
            <button
              className="min-h-11 rounded-full border border-border-default px-3 py-1.5 text-[12px] font-medium uppercase tracking-[0.16em] text-text-secondary transition hover:border-brand-primary hover:bg-brand-subtle hover:text-brand-primary"
              onClick={() => onKick(participant.sessionId)}
              type="button"
            >
              Kick
            </button>
          ) : null}
        </div>
        );
      })}
    </div>
  );
}
