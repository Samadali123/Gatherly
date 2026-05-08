import Modal from '../../../shared/components/Modal';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';

export default function ThreadPanel({ disabled = false, open, onClose, parent, replies, onReply, onUploadAttachments }) {
  return (
    <Modal open={open} onClose={onClose} title="Replies" variant="drawer-right">
      {!parent ? (
        <div className="rounded-xl border border-dashed border-border-default px-4 py-8 text-center text-[14px] text-text-secondary">
          Pick a message first to open its replies.
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col">
          <div className="scrollbar-chat min-h-0 flex-1 space-y-4 overflow-y-auto pr-1" data-chat-conversation-area>
            <div>
              <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.22em] text-text-secondary">Original message</p>
              <MessageBubble message={parent} />
            </div>
            <div className="space-y-3">
              <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-text-secondary">Replies</p>
              {replies.length ? replies.map((reply) => <MessageBubble key={reply._id} message={reply} />) : <p className="text-[14px] text-text-secondary">No replies yet.</p>}
            </div>
          </div>
          <div className="mt-4 shrink-0 border-t border-border-default pt-4">
            <ChatInput disabled={disabled || !parent} onSend={onReply} onUploadAttachments={onUploadAttachments} />
          </div>
        </div>
      )}
    </Modal>
  );
}
