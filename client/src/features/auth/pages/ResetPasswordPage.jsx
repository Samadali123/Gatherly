import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../services/api';
import ButtonSpinner from '../../../shared/components/ButtonSpinner';
import Spinner from '../../../shared/components/Spinner';
import { useUiStore } from '../../chat/chatStore';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const navigate = useNavigate();
  const { pushToast } = useUiStore();
  const [status, setStatus] = useState('loading');
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const validateToken = async () => {
      if (!token) {
        setStatus('invalid');
        return;
      }

      try {
        await api.get('/auth/validate-reset-token', { params: { token } });
        if (active) setStatus('valid');
      } catch {
        if (active) setStatus('invalid');
      }
    };

    validateToken();

    return () => {
      active = false;
    };
  }, [token]);

  const validateForm = () => {
    const nextErrors = {};

    if (form.newPassword.length < 8) {
      nextErrors.newPassword = 'Password must be at least 8 characters.';
    }

    if (form.newPassword !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', { token, newPassword: form.newPassword });
      pushToast('Password reset successfully. Redirecting to login...', 'success');
      window.setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (error) {
      if (error.response?.status === 400) {
        setStatus('invalid');
      } else {
        setErrors({ form: 'Something went wrong. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.3em] text-text-secondary">Gatherly</p>
        <h2 className="mt-3 font-display text-[20px] font-medium leading-[1.3] text-text-primary">This link has expired</h2>
        <p className="mt-2 text-[14px] leading-[1.6] text-text-secondary">Password reset links expire after 5 minutes.</p>
        <Link className="mt-6 inline-flex text-[13px] font-medium text-brand-primary transition hover:underline" to="/forgot-password">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[12px] font-medium uppercase tracking-[0.3em] text-text-secondary">Gatherly</p>
      <h2 className="mt-3 font-display text-[20px] font-medium leading-[1.3] text-text-primary">Set a new password</h2>
      <p className="mt-2 text-[14px] leading-[1.6] text-text-secondary">Choose a password you have not used before.</p>

      <form className="mt-6 space-y-5" onSubmit={submit}>
        {errors.form ? (
          <div className="rounded-xl border border-brand-primary bg-brand-subtle px-4 py-3 text-[13px] leading-[1.5] text-text-primary">
            {errors.form}
          </div>
        ) : null}

        <div>
          <label className="mb-2 block text-[14px] font-medium text-text-secondary">New password</label>
          <div className="relative">
            <input
              autoComplete="new-password"
              className="w-full rounded-xl border border-border-default bg-white px-4 py-3 pr-12 text-[14px] text-text-primary transition"
              onChange={(event) => {
                setForm((current) => ({ ...current, newPassword: event.target.value }));
                setErrors((current) => ({ ...current, newPassword: '' }));
              }}
              type={showNewPassword ? 'text' : 'password'}
              value={form.newPassword}
            />
            <button
              aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-text-secondary transition hover:text-brand-primary"
              onClick={() => setShowNewPassword((show) => !show)}
              type="button"
            >
              {showNewPassword ? <EyeOff size={17} strokeWidth={1.6} /> : <Eye size={17} strokeWidth={1.6} />}
            </button>
          </div>
          {errors.newPassword ? <p className="mt-2 text-[13px] leading-[1.5] text-red-600">{errors.newPassword}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-[14px] font-medium text-text-secondary">Confirm password</label>
          <div className="relative">
            <input
              autoComplete="new-password"
              className="w-full rounded-xl border border-border-default bg-white px-4 py-3 pr-12 text-[14px] text-text-primary transition"
              onChange={(event) => {
                setForm((current) => ({ ...current, confirmPassword: event.target.value }));
                setErrors((current) => ({ ...current, confirmPassword: '' }));
              }}
              type={showConfirmPassword ? 'text' : 'password'}
              value={form.confirmPassword}
            />
            <button
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-text-secondary transition hover:text-brand-primary"
              onClick={() => setShowConfirmPassword((show) => !show)}
              type="button"
            >
              {showConfirmPassword ? <EyeOff size={17} strokeWidth={1.6} /> : <Eye size={17} strokeWidth={1.6} />}
            </button>
          </div>
          {errors.confirmPassword ? <p className="mt-2 text-[13px] leading-[1.5] text-red-600">{errors.confirmPassword}</p> : null}
        </div>

        <button
          className="min-h-11 w-full rounded-xl bg-brand-primary px-4 py-3 text-[14px] font-medium text-white transition hover:bg-brand-hover active:scale-95 active:bg-brand-pressed disabled:cursor-not-allowed disabled:bg-border-default disabled:text-text-secondary"
          disabled={loading}
          type="submit"
        >
          <span className="inline-flex items-center justify-center gap-2">
            {loading ? <ButtonSpinner /> : null}
            Reset Password
          </span>
        </button>
      </form>
    </div>
  );
}
