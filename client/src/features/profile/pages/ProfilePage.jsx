import { Camera, Edit3, Mail, Phone, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import Avatar from '../../../shared/components/Avatar';
import { useAuthStore } from '../../auth/authStore';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-xl border border-border-default bg-bg-primary p-5 shadow-card sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={user?.name || user?.username || user?.email} src={user?.avatar || user?.profileImage} size="lg" />
            <div className="min-w-0">
              <h2 className="truncate font-display text-[24px] font-medium text-text-primary">{user?.name || 'Your profile'}</h2>
              <p className="mt-1 truncate text-[14px] text-text-secondary">@{user?.username}</p>
            </div>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-primary px-4 text-[14px] font-medium text-white transition hover:bg-brand-hover"
            to="/profile/edit"
          >
            <Edit3 size={16} strokeWidth={1.6} />
            Edit Profile
          </Link>
        </div>
      </section>

      <section className="grid gap-3 rounded-xl border border-border-default bg-bg-primary p-5 shadow-card sm:p-6">
        <div className="flex items-start gap-3">
          <UserRound className="mt-0.5 shrink-0 text-brand-primary" size={18} strokeWidth={1.6} />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-text-secondary">Bio</p>
            <p className="mt-1 text-[15px] text-text-primary">{user?.bio || 'No bio added yet.'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Mail className="shrink-0 text-brand-primary" size={18} strokeWidth={1.6} />
          <p className="min-w-0 truncate text-[15px] text-text-primary">{user?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Phone className="shrink-0 text-brand-primary" size={18} strokeWidth={1.6} />
          <p className="min-w-0 truncate text-[15px] text-text-primary">{user?.phone || 'Phone number not added'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Camera className="shrink-0 text-brand-primary" size={18} strokeWidth={1.6} />
          <p className="text-[15px] text-text-primary">Profile photo visible in chat and status.</p>
        </div>
      </section>
    </div>
  );
}
