import { useState } from 'react';
import { Link } from 'react-router-dom';
import ButtonSpinner from '../../../shared/components/ButtonSpinner';

export default function LoginForm({ error, onSubmit, loading }) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'personal',
  });
  const [localError, setLocalError] = useState('');

  const submit = () => {
    const nextForm = {
      email: form.email.trim(),
      password: form.password,
      role: form.role,
    };

    if (!nextForm.email) {
      setLocalError('Please enter your email address.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(nextForm.email)) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    if (!nextForm.password) {
      setLocalError('Please enter your password.');
      return;
    }

    setLocalError('');
    onSubmit(nextForm);
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {localError || error ? (
        <div className="rounded-xl border border-brand-primary bg-brand-subtle px-4 py-3 text-[13px] leading-[1.5] text-text-primary">
          {localError || error}
        </div>
      ) : null}
      <div>
        <label className="mb-2 block text-[14px] font-medium text-text-secondary">Email</label>
        <input
          className="w-full rounded-xl border border-border-default bg-white px-4 py-3 text-[14px] text-text-primary transition"
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          placeholder="samad@example.com"
          autoComplete="email"
          type="email"
          value={form.email}
        />
      </div>
      <div>
        <label className="mb-2 block text-[14px] font-medium text-text-secondary">Password</label>
        <input
          className="w-full rounded-xl border border-border-default bg-white px-4 py-3 text-[14px] text-text-primary transition"
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          placeholder="password123"
          autoComplete="current-password"
          type="password"
          value={form.password}
        />
        <div className="mt-2 text-right">
          <Link className="text-[13px] text-text-secondary transition hover:text-brand-primary hover:underline" to="/forgot-password">
            Forgot password?
          </Link>
        </div>
      </div>
      <div>
        <label className="mb-2 block text-[14px] font-medium text-text-secondary">Open as</label>
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-border-default bg-bg-secondary p-1">
          {[
            { value: 'personal', label: 'Personal' },
            { value: 'professional', label: 'Professional' },
          ].map((option) => (
            <button
              className={`min-h-11 rounded-lg text-[13px] font-medium ${form.role === option.value ? 'bg-brand-primary text-white' : 'bg-white text-text-secondary'}`}
              key={option.value}
              onClick={() => setForm((current) => ({ ...current, role: option.value }))}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <button
        className="w-full min-h-11 rounded-xl bg-brand-primary px-4 py-3 text-[14px] font-medium text-white transition hover:bg-brand-hover active:scale-95 active:bg-brand-pressed disabled:cursor-not-allowed disabled:bg-border-default disabled:text-text-secondary"
        disabled={loading}
        type="submit"
      >
        <span className="inline-flex items-center justify-center gap-2">
          {loading ? <ButtonSpinner /> : null}
          Sign in
        </span>
      </button>
    </form>
  );
}
