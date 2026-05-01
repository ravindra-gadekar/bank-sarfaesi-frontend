import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from './api/authApi';
import { useAuthStore } from '../../store/authStore';

export default function SsoCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginIdentity = useAuthStore((s) => s.loginIdentity);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Check for error from OAuth callback redirect
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError('Authentication failed. Redirecting to login…');
      setTimeout(() => navigate('/login', { replace: true }), 2000);
      return;
    }

    const handleCallback = async () => {
      try {
        // Cookies were set by the backend OAuth callback.
        // Fetch branches for the authenticated user.
        const { data } = await authApi.myBranches();
        if (cancelled) return;

        const branches = data.data.branches ?? [];
        // Extract email from the first branch's user or use empty (will be in JWT)
        const email = branches.length > 0 ? '' : '';
        loginIdentity(email, branches);
        navigate('/branches', { replace: true });
      } catch {
        if (cancelled) return;
        setError('Authentication failed. Redirecting to login…');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      }
    };

    handleCallback();
    return () => {
      cancelled = true;
    };
  }, [loginIdentity, navigate, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-sand-100 dark:bg-dark-bg">
      <div className="bg-sand-50 dark:bg-dark-surface p-8 rounded-2xl shadow-sm border border-sand-300 dark:border-dark-border text-center">
        {error ? (
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        ) : (
          <>
            <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm text-ink-secondary dark:text-dark-text-secondary">
              Completing sign-in…
            </p>
          </>
        )}
      </div>
    </div>
  );
}
