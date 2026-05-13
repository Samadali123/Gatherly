import { useEffect, useRef, useState } from 'react';
import api from '../../../services/api';

const loadGoogleScript = () =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

export default function GoogleAuthButton({ disabled, label = 'Continue with Google', onCredential }) {
  const buttonRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [clientId, setClientId] = useState('');

  useEffect(() => {
    let active = true;

    api
      .get('/auth/google/config')
      .then((response) => {
        if (!active) return;
        setClientId(response.data.data?.clientId || '');
      })
      .catch(() => setClientId(''));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!clientId || !buttonRef.current) return undefined;
    let active = true;

    loadGoogleScript()
      .then(() => {
        if (!active) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) onCredential(response.credential);
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: buttonRef.current.offsetWidth || 320,
          text: 'continue_with',
        });
        setReady(true);
      })
      .catch(() => setReady(false));

    return () => {
      active = false;
    };
  }, [clientId, onCredential]);

  if (!clientId) {
    return null;
  }

  return (
    <div className={disabled ? 'pointer-events-none opacity-60' : ''}>
      <div aria-label={label} className="min-h-11 w-full overflow-hidden rounded-xl" ref={buttonRef} />
      {!ready ? (
        <button className="mt-2 min-h-11 w-full rounded-xl border border-border-default bg-white text-[14px] font-medium text-text-secondary" disabled type="button">
          Loading Google...
        </button>
      ) : null}
    </div>
  );
}
