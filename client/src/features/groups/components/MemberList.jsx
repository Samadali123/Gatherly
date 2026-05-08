export default function MemberList({ activeConversation }) {
  if (!activeConversation || activeConversation.type !== 'group') {
    return (
      <div className="rounded-xl border border-dashed border-border-default px-4 py-5 text-[14px] leading-[1.6] text-text-secondary">
        Choose a group to see its live thread here.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border-default bg-bg-secondary px-4 py-5 text-[14px] leading-[1.6] text-text-secondary shadow-card">
      Group chat is active for <span className="font-medium text-text-primary">{activeConversation.name}</span>.
    </div>
  );
}
