import { useEffect, useState } from 'react';
import api from '../../../services/api';

export default function DndWhitelist({ selected, onChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
        setResults(response.data.data || []);
      } catch {
        setResults([]);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="space-y-4">
      <input
        className="w-full rounded-xl border border-border-default bg-white px-4 py-3 text-[14px] text-text-primary"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search people to pause"
        value={query}
      />

      <div className="flex flex-wrap gap-2">
        {selected.map((entry) => (
          <button
            className="min-h-11 rounded-full border border-border-default px-3 py-1.5 text-[12px] font-medium uppercase tracking-[0.16em] text-text-secondary"
            key={entry._id || entry.id}
            onClick={() => onChange(selected.filter((item) => (item._id || item.id) !== (entry._id || entry.id)))}
            type="button"
          >
            {entry.name || entry.username || entry.email || 'Muted user'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {results.map((result) => {
          const resultId = result._id || result.id;
          const exists = selected.some((entry) => (entry._id || entry.id) === resultId);

          return (
            <button
              className="flex w-full items-center justify-between rounded-xl border border-border-default bg-bg-secondary px-4 py-3 text-left"
              disabled={exists}
              key={resultId}
              onClick={() => onChange([...selected, result])}
              type="button"
            >
              <div>
                <p className="text-[14px] font-medium text-text-primary">{result.name || result.username}</p>
                <p className="text-[12px] text-text-secondary">{result.online ? 'Online now' : 'Available for DM'}</p>
              </div>
              <span className="text-[12px] font-medium uppercase tracking-[0.16em] text-text-secondary">{exists ? 'Paused' : 'Pause'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
