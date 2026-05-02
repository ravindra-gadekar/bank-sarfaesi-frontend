import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from './api/authApi';
import type { AxiosError } from 'axios';

type Stage = 'email' | 'otp';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

function getErrorMessage(err: unknown): string {
  const axErr = err as AxiosError<{ message?: string }>;
  if (axErr.response) {
    if (axErr.response.status === 429) return 'Too many attempts. Please wait and try again.';
    return axErr.response.data?.message || 'Something went wrong. Please try again.';
  }
  return 'Network error. Please check your connection.';
}

/* ---------- SVG icons for SSO buttons ---------- */

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.97 10.97 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 23 23">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
      <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

/* ---------- Component ---------- */

export default function LoginPage() {
  const navigate = useNavigate();
  const loginIdentity = useAuthStore((s) => s.loginIdentity);

  const [stage, setStage] = useState<Stage>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Focus first OTP input when entering OTP stage
  useEffect(() => {
    if (stage === 'otp') inputRefs.current[0]?.focus();
  }, [stage]);

  /* --- handlers --- */

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setLoading(true);
    try {
      await authApi.requestOtp(trimmed);
      setCountdown(RESEND_COOLDOWN);
      setStage('otp');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const digits = pasted.split('');
    setOtp((prev) => {
      const next = [...prev];
      digits.forEach((d, i) => { next[i] = d; });
      return next;
    });
    inputRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
  }, []);

  const selectOffice = useAuthStore((s) => s.selectOffice);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) { setError('Please enter all 6 digits.'); return; }

    setLoading(true);
    try {
      const { data } = await authApi.verifyOtp(email.trim().toLowerCase(), code);
      const payload = data.data as {
        email: string;
        branches: typeof data.data.branches;
        userKind?: 'app' | 'bank';
        user?: { id: string; email: string; name: string; userKind?: 'app' | 'bank'; appRole?: string; role?: string };
      };
      const branches = payload.branches ?? [];

      if (payload.userKind === 'app' && payload.user) {
        // App user: backend issued a full access token; jump straight to dashboard.
        loginIdentity(payload.email, []);
        selectOffice('', {
          id: payload.user.id,
          email: payload.user.email,
          name: payload.user.name,
          role: payload.user.role ?? 'admin',
          userKind: 'app',
          appRole: payload.user.appRole as 'superadmin' | 'admin' | 'support' | undefined,
        });
        navigate('/dashboard', { replace: true });
        return;
      }

      if (branches.length === 0) {
        setError('No account found for this email. Please ask your administrator to send you an invite.');
        setOtp(Array(OTP_LENGTH).fill(''));
        return;
      }
      loginIdentity(payload.email, branches);
      navigate('/offices', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError(null);
    try {
      await authApi.requestOtp(email.trim().toLowerCase());
      setCountdown(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  /* --- SSO buttons — redirect directly to backend OAuth routes --- */

  const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

  const handleSsoClick = (provider: 'google' | 'microsoft') => {
    window.location.href = `${API_BASE}/auth/sso/${provider}`;
  };

  /* --- render --- */

  return (
    <div>
      {/* Heading */}
      <h1 className="text-2xl font-bold text-ink dark:text-dark-text">Login</h1>
      <p className="mt-1.5 text-sm text-ink-secondary dark:text-dark-text-secondary">
        Enter your credentials to access your workspace.
      </p>

      {/* Error banner */}
      {error && (
        <div className="mt-5 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* ---- EMAIL STAGE ---- */}
      {stage === 'email' && (
        <form onSubmit={handleEmailSubmit} className="mt-7 space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary dark:text-dark-text-secondary mb-1.5"
            >
              Email
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink-tertiary dark:text-dark-text-tertiary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sand-300 dark:border-dark-border bg-white dark:bg-dark-bg text-ink dark:text-dark-text placeholder:text-ink-tertiary dark:placeholder:text-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Sign In button */}
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full flex items-center justify-center gap-2 bg-accent text-white py-2.5 px-4 rounded-xl font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {loading ? (
              'Please wait…'
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                Sign In
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-sand-300 dark:border-dark-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-dark-bg px-3 text-xs uppercase tracking-wider text-ink-tertiary dark:text-dark-text-tertiary">
                Or continue with
              </span>
            </div>
          </div>

          {/* SSO buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleSsoClick('google')}
              disabled={loading}
              className="w-full flex items-center gap-3 justify-center py-2.5 px-4 rounded-xl border border-sand-300 dark:border-dark-border bg-white dark:bg-dark-bg text-ink dark:text-dark-text font-medium hover:bg-sand-100 dark:hover:bg-dark-surface-hover transition-colors disabled:opacity-50"
            >
              <GoogleIcon />
              Google
            </button>

            <button
              type="button"
              onClick={() => handleSsoClick('microsoft')}
              disabled={loading}
              className="w-full flex items-center gap-3 justify-center py-2.5 px-4 rounded-xl border border-sand-300 dark:border-dark-border bg-white dark:bg-dark-bg text-ink dark:text-dark-text font-medium hover:bg-sand-100 dark:hover:bg-dark-surface-hover transition-colors disabled:opacity-50"
            >
              <MicrosoftIcon />
              Microsoft
            </button>
          </div>
        </form>
      )}

      {/* ---- OTP STAGE ---- */}
      {stage === 'otp' && (
        <form onSubmit={handleVerify} className="mt-7 space-y-5">
          <p className="text-sm text-ink-secondary dark:text-dark-text-secondary">
            We sent a 6-digit verification code to{' '}
            <span className="font-medium text-ink dark:text-dark-text">{email}</span>
          </p>

          {/* OTP boxes */}
          <div className="flex gap-2.5 justify-center" onPaste={handleOtpPaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                className="w-12 h-13 text-center text-xl font-semibold rounded-xl border border-sand-300 dark:border-dark-border bg-white dark:bg-dark-bg text-ink dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
              />
            ))}
          </div>

          {/* Verify button */}
          <button
            type="submit"
            disabled={loading || otp.join('').length !== OTP_LENGTH}
            className="w-full flex items-center justify-center gap-2 bg-accent text-white py-2.5 px-4 rounded-xl font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying…' : 'Verify & Sign In'}
          </button>

          {/* Back / Resend row */}
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => { setStage('email'); setOtp(Array(OTP_LENGTH).fill('')); setError(null); }}
              className="text-ink-tertiary dark:text-dark-text-tertiary hover:text-ink dark:hover:text-dark-text transition-colors"
            >
              ← Back
            </button>
            {countdown > 0 ? (
              <span className="text-ink-tertiary dark:text-dark-text-tertiary">Resend in {countdown}s</span>
            ) : (
              <button type="button" onClick={handleResend} className="text-accent hover:text-accent-hover font-medium transition-colors">
                Resend OTP
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
