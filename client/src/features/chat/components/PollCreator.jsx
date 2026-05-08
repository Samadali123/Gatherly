import { useEffect, useState } from 'react';
import ButtonSpinner from '../../../shared/components/ButtonSpinner';

export default function PollCreator({ open, onCreate, loading, onClose }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    setQuestion('');
    setOptions(['', '']);
    setError('');
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="mb-3 rounded-xl border border-border-default bg-white p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-text-secondary">Create poll</p>
          <p className="mt-1 text-[13px] text-text-secondary">Add a question and options. The poll will use the current time automatically.</p>
        </div>
        <button className="min-h-11 rounded-full border border-border-default px-3 text-[12px] font-medium uppercase tracking-[0.16em] text-text-secondary" onClick={onClose} type="button">
          Close
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <input
          className="w-full rounded-xl border border-border-default bg-bg-primary px-4 py-3 text-[14px] text-text-primary"
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Question"
          value={question}
        />

        {error ? (
          <div className="rounded-xl border border-brand-primary bg-brand-subtle px-4 py-3 text-[13px] leading-[1.5] text-text-primary">
            {error}
          </div>
        ) : null}

        {options.map((option, index) => (
          <div className="flex gap-2" key={`option-${index}`}>
            <input
              className="flex-1 rounded-xl border border-border-default bg-bg-primary px-4 py-3 text-[14px] text-text-primary"
              onChange={(event) => setOptions((current) => current.map((entry, optionIndex) => (optionIndex === index ? event.target.value : entry)))}
              placeholder={`Option ${index + 1}`}
              value={option}
            />
            {options.length > 2 ? (
              <button
                className="min-h-11 rounded-xl border border-border-default px-3 py-2 text-[12px] font-medium uppercase tracking-[0.16em] text-text-secondary"
                onClick={() => setOptions((current) => current.filter((_, optionIndex) => optionIndex !== index))}
                type="button"
              >
                Remove
              </button>
            ) : null}
          </div>
        ))}

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="min-h-11 rounded-full border border-border-default px-3 py-2 text-[12px] font-medium uppercase tracking-[0.16em] text-text-secondary"
            onClick={() => setOptions((current) => [...current, ''])}
            type="button"
          >
            Add option
          </button>
        </div>

        <button
          className="min-h-11 rounded-full bg-brand-primary px-4 py-2 text-[14px] font-medium text-white transition hover:bg-brand-hover active:scale-95 active:bg-brand-pressed disabled:bg-border-default disabled:text-text-secondary"
          disabled={loading}
          onClick={async () => {
            if (!question.trim()) {
              setError('Please add a poll question.');
              return;
            }

            if (options.filter((option) => option.trim()).length < 2) {
              setError('Please add at least 2 poll options.');
              return;
            }

            try {
              setError('');
              await onCreate({
                question,
                options: options.filter((option) => option.trim()),
                expiresAt: null,
              });
              onClose?.();
            } catch {}
          }}
          type="button"
        >
          <span className="inline-flex items-center justify-center gap-2">
            {loading ? <ButtonSpinner /> : null}
            Create poll
          </span>
        </button>
      </div>
    </div>
  );
}
