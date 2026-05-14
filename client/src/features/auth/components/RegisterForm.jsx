import { useState } from 'react';
import ButtonSpinner from '../../../shared/components/ButtonSpinner';

export default function RegisterForm({ error, onRoleChange, onSubmit, loading }) {
  const [form, setForm] = useState({
    name: '',
    emailOrPhone: '',
    password: '',
    role: 'personal',
  });
  const [localError, setLocalError] = useState('');

  const submit = () => {
    const nextForm = {
      name: form.name.trim(),
      emailOrPhone: form.emailOrPhone.trim(),
      password: form.password,
      role: form.role,
    };

    if (nextForm.name.length < 2) {
      setLocalError('Please enter your full name.');
      return;
    }

    if (!nextForm.emailOrPhone) {
      setLocalError('Please enter your email or mobile number.');
      return;
    }

    if (nextForm.password.length < 8) {
      setLocalError('Please use a password with at least 8 characters.');
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
        <label className="mb-2 block text-[14px] font-medium text-text-secondary">Name</label>
        <input
          className="w-full rounded-xl border border-border-default bg-white px-4 py-3 text-[14px] text-text-primary transition"
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="username"
          autoComplete="name"
          type="text"
          value={form.name}
        />
      </div>
      <div>
        <label className="mb-2 block text-[14px] font-medium text-text-secondary">Email or mobile number</label>
        <input
          className="w-full rounded-xl border border-border-default bg-white px-4 py-3 text-[14px] text-text-primary transition"
          onChange={(event) => setForm((current) => ({ ...current, emailOrPhone: event.target.value }))}
          placeholder="gatherly@gmail.com or +91 9893005689"
          autoComplete="username"
          type="text"
          value={form.emailOrPhone}
        />
      </div>
      <div>
        <label className="mb-2 block text-[14px] font-medium text-text-secondary">Password</label>
        <input
          className="w-full rounded-xl border border-border-default bg-white px-4 py-3 text-[14px] text-text-primary transition"
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          type="password"
          value={form.password}
        />
      </div>
      <div>
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-border-default bg-bg-secondary p-1">
          {[
            { value: 'personal', label: 'Personal' },
            { value: 'professional', label: 'Professional' },
          ].map((option) => (
            <button
              className={`min-h-11 rounded-lg text-[13px] font-medium ${form.role === option.value ? 'bg-brand-primary text-white' : 'bg-white text-text-secondary'}`}
              key={option.value}
              onClick={() => {
                setForm((current) => ({ ...current, role: option.value }));
                onRoleChange?.(option.value);
              }}
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
          Create account
        </span>
      </button>
    </form>
  );
}
