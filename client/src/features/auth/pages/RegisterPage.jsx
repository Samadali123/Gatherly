import { Link, useNavigate } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';
import { useAuth } from '../hooks/useAuth';
import { useUiStore } from '../../chat/chatStore';
import { useState } from 'react';
import { getFriendlyErrorMessage } from '../../../shared/utils/errorMessage';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const { pushToast } = useUiStore();
  const [error, setError] = useState('');

  const onSubmit = async (payload) => {
    try {
      setError('');
      const auth = await register(payload);
      navigate(auth.user?.role === 'professional' ? '/rooms/new' : '/chat');
    } catch (error) {
      const message = getFriendlyErrorMessage(error, 'Unable to create account. Please try again.');
      setError(message);
      pushToast(message, 'error', 'Registration failed');
    }
  };

  return (
    <div>
      <p className="text-[12px] font-medium uppercase tracking-[0.3em] text-text-secondary">Gatherly</p>
      <h2 className="mt-3 font-display text-[28px] font-medium leading-[1.3] tracking-[-0.01em] text-text-primary">Create your workspace</h2>
      <p className="mt-2 text-[14px] leading-[1.6] text-text-secondary">
        Start a private place for direct messages, anonymous rooms, pinned decisions, and focused replies.
      </p>

      <div className="mt-6">
        <RegisterForm error={error} loading={loading} onSubmit={onSubmit} />
      </div>

      <p className="mt-6 text-[14px] leading-[1.6] text-text-secondary">
        Already registered?{' '}
        <Link className="font-medium text-brand-primary" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
