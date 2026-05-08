import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import ButtonSpinner from '../../../shared/components/ButtonSpinner';

const emailPattern = /^\S+@\S+\.\S+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const sendResetLink = async (targetEmail = email) => {
    const normalizedEmail = targetEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email: normalizedEmail });
      setSubmittedEmail(normalizedEmail);
      setSuccess(true);
    } catch (requestError) {
      if (requestError.response?.status === 404) {
        setError('No account found with this email address.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="text-[12px] font-medium uppercase tracking-[0.3em] text-text-secondary">Gatherly</p>
      {success ? (
        <div className="mt-4">
          <h2 className="font-display text-[20px] font-medium leading-[1.3] text-text-primary">Check your email</h2>
          <p className="mt-3 text-[14px] leading-[1.6] text-text-secondary">
            A reset link has been sent to {submittedEmail}. It expires in 5 minutes.
          </p>
          <button
            className="mt-5 text-[13px] font-medium text-brand-primary transition hover:underline disabled:cursor-not-allowed disabled:text-text-secondary"
            disabled={loading}
            onClick={() => sendResetLink(submittedEmail)}
            type="button"
          >
            {loading ? 'Sending...' : 'Resend email'}
          </button>
          <div className="mt-6">
            <Link className="text-[13px] text-text-secondary transition hover:text-brand-primary hover:underline" to="/login">
              ← Back to login
            </Link>
          </div>
        </div>
      ) : (
        <>
          <h2 className="mt-3 font-display text-[20px] font-medium leading-[1.3] text-text-primary">Forgot your password?</h2>
          <p className="mt-2 text-[14px] leading-[1.6] text-text-secondary">Enter your email and we'll send you a reset link.</p>

          <form
            className="mt-6 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              sendResetLink();
            }}
          >
            <div>
              <label className="mb-2 block text-[14px] font-medium text-text-secondary">Email address</label>
              <input
                autoComplete="email"
                className="w-full rounded-xl border border-border-default bg-white px-4 py-3 text-[14px] text-text-primary transition"
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError('');
                }}
                placeholder="samad@example.com"
                type="email"
                value={email}
              />
              {error ? <p className="mt-2 text-[13px] leading-[1.5] text-red-600">{error}</p> : null}
            </div>

            <button
              className="min-h-11 w-full rounded-xl bg-brand-primary px-4 py-3 text-[14px] font-medium text-white transition hover:bg-brand-hover active:scale-95 active:bg-brand-pressed disabled:cursor-not-allowed disabled:bg-border-default disabled:text-text-secondary"
              disabled={loading}
              type="submit"
            >
              <span className="inline-flex items-center justify-center gap-2">
                {loading ? <ButtonSpinner /> : null}
                {loading ? 'Sending...' : 'Send Reset Link'}
              </span>
            </button>
          </form>

          <div className="mt-6">
            <Link className="text-[13px] text-text-secondary transition hover:text-brand-primary hover:underline" to="/login">
              ← Back to login
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
