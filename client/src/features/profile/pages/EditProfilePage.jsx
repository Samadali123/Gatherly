import { Camera, CheckCircle2, Loader2, Save, X, XCircle } from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import api from '../../../services/api';
import { resolveMediaUrl } from '../../../shared/utils/mediaUrl';
import { useAuthStore } from '../../auth/authStore';
import { useUiStore } from '../../chat/chatStore';
import { getCroppedImg } from '../utils/cropImage';

const Cropper = lazy(() => import('react-easy-crop'));
const usernamePattern = /^[a-zA-Z0-9_]{3,30}$/;

const fieldClass =
  'w-full rounded-xl border border-border-default bg-white px-4 py-3 text-[14px] text-text-primary outline-none transition focus:border-brand-primary';

export default function EditProfilePage() {
  const fileInputRef = useRef(null);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const { pushToast } = useUiStore();
  const [form, setForm] = useState({
    username: '',
    bio: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState('idle');
  const [usernameMessage, setUsernameMessage] = useState('');
  const [cropSource, setCropSource] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarUrl = resolveMediaUrl(user?.avatar || user?.profileImage);

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm({
      username: user.username || '',
      bio: user.bio || '',
      phone: user.phone || '',
    });
  }, [user]);

  const changedPayload = useMemo(() => {
    const payload = {};
    if (form.username.trim() !== (user?.username || '')) payload.username = form.username.trim();
    if (form.bio.trim() !== (user?.bio || '')) payload.bio = form.bio.trim();
    if (form.phone.trim() !== (user?.phone || '')) payload.phone = form.phone.trim();
    return payload;
  }, [form, user]);

  const validate = () => {
    const nextErrors = {};

    if (!usernamePattern.test(form.username.trim())) nextErrors.username = 'Username must be 3-30 letters, numbers, or underscores.';
    if (form.bio.length > 160) nextErrors.bio = 'Bio must be 160 characters or less.';
    if (form.phone && !/^[+()\-\s0-9]*$/.test(form.phone)) nextErrors.phone = 'Enter a valid phone number.';
    if (usernameStatus === 'taken') nextErrors.username = 'Username already taken.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const checkUsername = () => {
    const username = form.username.trim();
    if (!usernamePattern.test(username) || username === user?.username) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return;
    }

    setUsernameStatus('loading');
    window.setTimeout(async () => {
      try {
        const response = await api.get(`/users/check-username?username=${encodeURIComponent(username)}`);
        const available = Boolean(response.data.data?.available);
        setUsernameStatus(available ? 'available' : 'taken');
        setUsernameMessage(available ? 'Username available' : 'Username already taken');
      } catch {
        setUsernameStatus('idle');
        setUsernameMessage('');
      }
    }, 500);
  };

  const saveProfile = async () => {
    if (!validate()) {
      return;
    }

    if (!Object.keys(changedPayload).length) {
      pushToast('No profile changes to save', 'info');
      return;
    }

    setSaving(true);
    try {
      const response = await api.patch('/users/profile', changedPayload);
      setUser({ ...user, ...response.data.data.user });
      window.setTimeout(() => {
        setForm({ username: '', bio: '', phone: '' });
        setUsernameStatus('idle');
        setUsernameMessage('');
        setErrors({});
      }, 0);
      pushToast('Profile updated successfully', 'success');
    } catch (error) {
      const apiErrors = error.response?.data?.errors;
      if (apiErrors) {
        setErrors(apiErrors);
      }
      pushToast(error.response?.data?.message || 'Unable to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectAvatar = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    setCropSource(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const saveCroppedAvatar = async () => {
    if (!cropSource || !croppedAreaPixels) {
      return;
    }

    setAvatarUploading(true);
    try {
      const { default: imageCompression } = await import('browser-image-compression');
      const cropped = await getCroppedImg(cropSource, croppedAreaPixels);
      const uploadFile = cropped.size > 1.5 * 1024 * 1024
        ? await imageCompression(cropped, { maxSizeMB: 1, maxWidthOrHeight: 800 })
        : cropped;
      const formData = new FormData();
      formData.append('avatar', uploadFile);
      const response = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUser({ ...user, ...response.data.data.user });
      setCropSource('');
      pushToast('Profile photo updated', 'success');
    } catch (error) {
      pushToast(error.response?.data?.message || 'Unable to update profile photo', 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-full items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-xl border border-border-default bg-white p-5 text-center shadow-card">
          <Loader2 className="mx-auto animate-spin text-brand-primary" size={28} />
          <h2 className="mt-4 font-display text-[24px] font-medium text-text-primary">Loading profile</h2>
          <p className="mt-2 text-[14px] leading-[1.6] text-text-secondary">We are preparing your profile details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-xl border border-border-default bg-bg-primary p-5 shadow-card sm:p-7">
        <div className="flex flex-col items-center gap-4 text-center">
          <button
            className="group relative h-24 w-24 overflow-hidden rounded-full border border-border-default bg-brand-subtle shadow-card"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            {avatarUrl ? <img alt="Profile avatar" className="h-full w-full object-cover" src={avatarUrl} /> : null}
            <span className="absolute inset-0 hidden items-center justify-center bg-black/55 text-white group-hover:flex">
              <Camera size={24} strokeWidth={1.7} />
            </span>
          </button>
          <input accept="image/*" className="hidden" onChange={selectAvatar} ref={fileInputRef} type="file" />
          <div>
            <h2 className="font-display text-[26px] font-medium text-text-primary">Edit Profile</h2>
            <p className="mt-1 text-[14px] text-text-secondary">Manage your profile</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border-default bg-bg-primary p-5 shadow-card sm:p-7">
        <div className="grid gap-5">
          <label className="grid gap-2">
            <span className="text-[13px] font-medium text-text-primary">Username</span>
            <input className={fieldClass} maxLength={30} onBlur={checkUsername} onChange={(event) => setForm({ ...form, username: event.target.value })} value={form.username} />
            {usernameStatus === 'loading' ? <span className="inline-flex items-center gap-2 text-[12px] text-text-secondary"><Loader2 className="animate-spin" size={13} /> Checking username</span> : null}
            {usernameStatus === 'available' ? <span className="inline-flex items-center gap-2 text-[12px] text-green-700"><CheckCircle2 size={13} /> {usernameMessage}</span> : null}
            {usernameStatus === 'taken' ? <span className="inline-flex items-center gap-2 text-[12px] text-red-600"><XCircle size={13} /> {usernameMessage}</span> : null}
            {errors.username ? <span className="text-[12px] text-red-600">{errors.username}</span> : null}
          </label>

          <label className="grid gap-2">
            <span className="text-[13px] font-medium text-text-primary">Bio</span>
            <textarea className={`${fieldClass} min-h-28 resize-none`} maxLength={160} onChange={(event) => setForm({ ...form, bio: event.target.value })} value={form.bio} />
            <span className="text-right text-[12px] text-text-secondary">{form.bio.length} / 160</span>
            {errors.bio ? <span className="text-[12px] text-red-600">{errors.bio}</span> : null}
          </label>

          <label className="grid gap-2">
            <span className="text-[13px] font-medium text-text-primary">Phone number</span>
            <input className={fieldClass} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+1 555 000 0000" value={form.phone} />
            {errors.phone ? <span className="text-[12px] text-red-600">{errors.phone}</span> : null}
          </label>

          <div className="flex justify-end">
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-primary px-5 text-[14px] font-medium text-white transition hover:bg-brand-hover disabled:bg-border-default disabled:text-text-secondary"
              disabled={saving}
              onClick={saveProfile}
              type="button"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} strokeWidth={1.6} />}
              Save Changes
            </button>
          </div>
        </div>
      </section>

      {cropSource ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 py-6">
          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border-default bg-bg-primary shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
              <p className="text-[15px] font-medium text-text-primary">Crop profile photo</p>
              <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-brand-subtle" onClick={() => setCropSource('')} type="button">
                <X size={18} strokeWidth={1.6} />
              </button>
            </div>
            <div className="relative h-[340px] bg-black">
              <Suspense fallback={<div className="flex h-full items-center justify-center text-white"><Loader2 className="animate-spin" size={24} /></div>}>
                <Cropper
                  aspect={1}
                  crop={crop}
                  cropShape="round"
                  image={cropSource}
                  onCropChange={setCrop}
                  onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                  onZoomChange={setZoom}
                  showGrid={false}
                  zoom={zoom}
                />
              </Suspense>
            </div>
            <div className="flex flex-col-reverse gap-3 px-4 py-4 sm:flex-row sm:justify-end">
              <button className="min-h-11 rounded-full border border-border-default px-4 text-[14px] font-medium text-text-secondary" onClick={() => setCropSource('')} type="button">
                Cancel
              </button>
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-primary px-4 text-[14px] font-medium text-white" disabled={avatarUploading} onClick={saveCroppedAvatar} type="button">
                {avatarUploading ? <Loader2 className="animate-spin" size={16} /> : null}
                Crop & Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
