import { useState } from 'react';
import Modal from '../../../shared/components/Modal';
import ButtonSpinner from '../../../shared/components/ButtonSpinner';

export default function CreateGroupModal({ mode, open, onClose, onSubmit, loading }) {
  const [groupName, setGroupName] = useState('');

  const title = mode === 'join' ? 'Join a Group' : 'Create a Group';

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await onSubmit(groupName);
          setGroupName('');
          onClose();
        }}
      >
        <div>
          <label className="mb-2 block text-[14px] font-medium text-text-secondary">Group name</label>
          <input
            className="w-full rounded-xl border border-border-default bg-white px-4 py-3 text-[14px] text-text-primary transition"
            onChange={(event) => setGroupName(event.target.value)}
            placeholder="team-alpha"
            value={groupName}
          />
        </div>
        <div className="flex justify-end gap-3">
          <button className="min-h-11 rounded-full px-4 py-2 text-[14px] text-text-secondary" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="min-h-11 rounded-full bg-brand-primary px-4 py-2 text-[14px] font-medium text-white transition hover:bg-brand-hover active:scale-95 active:bg-brand-pressed disabled:bg-border-default disabled:text-text-secondary"
            disabled={loading || !groupName.trim()}
            type="submit"
          >
            <span className="inline-flex items-center justify-center gap-2">
              {loading ? <ButtonSpinner /> : null}
              {mode === 'join' ? 'Join group' : 'Create group'}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
