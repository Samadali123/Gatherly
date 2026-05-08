import { formatDate } from '../../../shared/utils/formatDate';

export default function PollCard({ poll, onVote }) {
  const totalVotes = poll.options.reduce((sum, option) => sum + (option.voteCount || 0), 0);

  return (
    <div className="rounded-xl border border-border-default bg-bg-primary p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.24em] text-text-secondary">Poll</p>
          <h4 className="mt-2 font-display text-[20px] font-medium leading-[1.35] text-text-primary">{poll.question}</h4>
        </div>
        {poll.expiresAt ? <span className="text-[12px] text-text-secondary">{formatDate(poll.expiresAt)}</span> : null}
      </div>
      <div className="mt-4 space-y-3">
        {poll.options.map((option) => {
          const width = totalVotes ? `${(option.voteCount / totalVotes) * 100}%` : '0%';
          return (
            <button
              className="w-full overflow-hidden rounded-xl border border-border-default bg-bg-secondary text-left"
              disabled={!poll.isActive}
              key={option.id}
              onClick={() => onVote(option.id)}
              type="button"
            >
              <div className="flex items-center justify-between px-4 py-3">
                <span className="relative z-10 text-[14px] font-medium text-text-primary">{option.text}</span>
                <span className="relative z-10 text-[12px] text-text-secondary">{option.voteCount} votes</span>
              </div>
              <div className="h-1.5 bg-brand-subtle">
                <div className="h-full bg-brand-primary transition-all" style={{ width }} />
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[12px] text-text-secondary">{totalVotes} total votes</p>
    </div>
  );
}
