import { MessageCircle, UserMinus, UserPlus, Ban, X } from 'lucide-react';
import Avatar from '../../../shared/components/Avatar';

export default function UserProfileModal({ user, loading, onClose, onMessage, onFollow, onUnfollow, onBlock, onUnblock }) {
  if (!user) return null;

  const relationship = user.relationship || {};
  const counts = user.counts || {};

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/55 px-4 py-6" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl border border-border-default bg-bg-primary p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-end">
          <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-brand-subtle" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="text-center">
          <Avatar name={user.name || user.username || user.email} src={user.avatar || user.profileImage} size="lg" />
          <h3 className="mt-4 truncate font-display text-[24px] font-medium text-text-primary">{user.name || 'Gatherly user'}</h3>
          <p className="mt-1 truncate text-[14px] text-text-secondary">@{user.username}</p>
          {user.bio ? <p className="mt-4 text-[14px] leading-[1.6] text-text-primary">{user.bio}</p> : null}
          {user.profileNote ? <p className="mt-3 rounded-xl bg-brand-subtle px-4 py-3 text-[14px] text-text-primary">{user.profileNote}</p> : null}
          <div className="mt-4 grid grid-cols-2 gap-2 text-center text-[13px] text-text-secondary">
            <div className="rounded-xl border border-border-default bg-white px-3 py-2">
              <p className="font-medium text-text-primary">{counts.followers || 0}</p>
              Followers
            </div>
            <div className="rounded-xl border border-border-default bg-white px-3 py-2">
              <p className="font-medium text-text-primary">{counts.following || 0}</p>
              Following
            </div>
          </div>
        </div>

        {!relationship.isSelf ? (
          <div className="mt-5 grid gap-2">
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-primary px-4 text-[14px] font-medium text-white disabled:opacity-60" disabled={loading || relationship.blockedByMe} onClick={onMessage} type="button">
              <MessageCircle size={16} /> Message
            </button>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border-default bg-white px-4 text-[14px] font-medium text-text-secondary disabled:opacity-60" disabled={loading || relationship.blockedByMe} onClick={relationship.following ? onUnfollow : onFollow} type="button">
              {relationship.following ? <UserMinus size={16} /> : <UserPlus size={16} />}
              {relationship.following ? 'Unfollow' : 'Follow'}
            </button>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#f2cec1] bg-[#fff4ef] px-4 text-[14px] font-medium text-[#9a3412] disabled:opacity-60" disabled={loading} onClick={relationship.blockedByMe ? onUnblock : onBlock} type="button">
              <Ban size={16} />
              {relationship.blockedByMe ? 'Unblock' : 'Block'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
