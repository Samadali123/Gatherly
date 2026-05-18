import { Link, useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { useUiStore } from '../../chat/chatStore';
import { useState } from 'react';
import { getFriendlyErrorMessage } from '../../../shared/utils/errorMessage';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const { pushToast } = useUiStore();
  const [error, setError] = useState('');

  const onSubmit = async (payload) => {
    try {
      setError('');
      const auth = await login(payload);
      navigate(auth.user?.role === 'professional' ? '/rooms/new' : '/chat');
    } catch (error) {
      const message = getFriendlyErrorMessage(error, 'Unable to sign in. Please try again.');
      setError(message);
      pushToast(message, 'error', 'Login failed');
    }
  };

  return (
    <div>
      <p className="text-[12px] font-medium uppercase tracking-[0.3em] text-text-secondary">Gatherly</p>
      <h2 className="mt-3 font-display text-[28px] font-medium leading-[1.3] tracking-[-0.01em] text-text-primary">Welcome back</h2>
      <p className="mt-2 text-[14px] leading-[1.6] text-text-secondary">
        Sign in to continue your chats, rooms, pins, and reply threads from one calm workspace.
      </p>

      <div className="mt-6">
        <LoginForm error={error} loading={loading} onSubmit={onSubmit} />
      </div>

      <p className="mt-6 text-[14px] leading-[1.6] text-text-secondary">
        Need an account?{' '}
        <Link className="font-medium text-brand-primary" to="/register">
          Create one
        </Link>
      </p>
    </div>
  );
}
