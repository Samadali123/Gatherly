import Avatar from '../../../shared/components/Avatar';
import Badge from '../../../shared/components/Badge';
import { cn } from '../../../shared/utils/cn';
import { memo, useMemo } from 'react';

function ConversationList({ contacts, activeConversation, onSelect }) {
  const items = useMemo(() => [
    ...contacts.map((item) => ({
      ...item,
      label: item.displayName || item.name || item.username,
      target: item.target || item.username,
      kind: 'Direct',
      key: item.userId || item.username,
    })),
  ], [contacts]);

  if (!items.length) {
    return <p className="px-4 py-8 text-[14px] leading-[1.6] text-text-secondary">No users available yet.</p>;
  }

  return (
    <div className="space-y-3 px-2 pb-4">
      {items.map((item) => {
        const active =
          activeConversation &&
          (activeConversation.key === item.key ||
            activeConversation.username === item.username ||
            activeConversation.name === item.name);

        return (
          <button
            className={cn(
              'flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition',
              active
                ? 'border-brand-primary bg-brand-subtle text-text-primary shadow-card'
                : 'border-border-default bg-bg-primary text-text-primary hover:border-brand-primary/30 hover:bg-brand-subtle'
            )}
            key={item.key}
            onClick={() => onSelect({ ...item, type: 'dm' })}
            type="button"
          >
            <Avatar
              name={item.label}
              online={Boolean(item.online)}
              src={item.profileImage || item.avatar}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium leading-5">{item.label}</p>
              <p
                className="max-w-full overflow-hidden whitespace-nowrap text-[13px] leading-5 text-text-secondary"
                style={{ textOverflow: 'ellipsis' }}
              >
                {item.lastMessagePreview || (item.online ? 'Online now' : 'Available for DM')}
              </p>
            </div>
            <Badge className={item.unreadCount ? 'bg-brand-primary text-white' : active ? 'bg-white text-brand-primary' : ''}>
              {item.unreadCount ? item.unreadCount : item.online ? 'Online' : 'DM'}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}

export default memo(ConversationList);
