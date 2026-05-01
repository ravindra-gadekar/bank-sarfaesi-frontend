import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import apiClient from '../../lib/apiClient';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  designation: z.string().optional(),
  mobile: z.string().regex(/^(\+91[\-\s]?)?[6-9]\d{9}$/, 'Enter a valid Indian mobile number').or(z.literal('')).optional(),
});

type FormData = z.infer<typeof schema>;

interface InviteData {
  email: string;
  role: string;
  branchId: string;
}

export default function InviteSignupPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [inviteError, setInviteError] = useState('');
  const [loadingInvite, setLoadingInvite] = useState(true);

  // OTP state
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [resendTimer, setResendTimer] = useState(0);
  const [otpError, setOtpError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { register, handleSubmit, setError: setFieldError, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    if (!token) return;
    const validate = async () => {
      try {
        const res = await apiClient.get(`/invite/${encodeURIComponent(token)}/validate`);
        setInvite(res.data);
      } catch {
        setInviteError('This invite link is invalid or has expired.');
      } finally {
        setLoadingInvite(false);
      }
    };
    validate();
  }, [token]);

  const requestOtp = useCallback(async () => {
    if (!invite) return;
    try {
      await apiClient.post('/auth/otp/request', { email: invite.email });
      setResendTimer(RESEND_COOLDOWN);
    } catch {
      setOtpError('Failed to send OTP.');
    }
  }, [invite]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleFormSubmit = (data: FormData) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormData;
        setFieldError(field, { message: issue.message });
      }
      return;
    }
    setOtpStep(true);
    requestOtp();
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setOtpError('');
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleAccept = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      setOtpError('Please enter the complete 6-digit OTP');
      return;
    }

    setSubmitting(true);
    setOtpError('');

    const formEl = document.querySelector('form');
    const nameInput = formEl?.querySelector<HTMLInputElement>('[name="name"]');
    const designationInput = formEl?.querySelector<HTMLInputElement>('[name="designation"]');
    const mobileInput = formEl?.querySelector<HTMLInputElement>('[name="mobile"]');

    try {
      await apiClient.post(`/invite/${encodeURIComponent(token!)}/accept`, {
        name: nameInput?.value || '',
        email: invite!.email,
        otp: code,
        designation: designationInput?.value || undefined,
        mobile: mobileInput?.value || undefined,
      });
      navigate('/dashboard');
    } catch {
      setOtpError('Invalid OTP or invite acceptance failed. Please try again.');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-sand-300 bg-white text-ink placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent dark:bg-dark-surface dark:border-dark-border dark:text-dark-text dark:placeholder:text-dark-text-tertiary';

  if (loadingInvite) {
    return (
      <div className="min-h-screen bg-sand-100 dark:bg-dark-bg flex items-center justify-center">
        <p className="text-ink-secondary dark:text-dark-text-secondary">Validating invite...</p>
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="min-h-screen bg-sand-100 dark:bg-dark-bg flex items-center justify-center px-4">
        <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl shadow-sm border border-sand-300 dark:border-dark-border p-8 max-w-md text-center">
          <div className="text-3xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-ink dark:text-dark-text mb-2">Invalid Invite</h2>
          <p className="text-ink-secondary dark:text-dark-text-secondary mb-6">{inviteError}</p>
          <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary">
            Please contact your branch admin for a new invitation.
          </p>
        </div>
      </div>
    );
  }

  const roleBadgeColor: Record<string, string> = {
    Admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    Manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    Maker: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    Checker: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    Auditor: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
  };

  return (
    <div className="min-h-screen bg-sand-100 dark:bg-dark-bg flex flex-col items-center justify-center px-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-ink dark:text-dark-text tracking-tight">Bank SARFAESI</h1>
        <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary mt-1">Accept Invitation</p>
      </div>

      <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl shadow-sm border border-sand-300 dark:border-dark-border p-8 w-full max-w-md">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div>
              <div className="text-xs text-ink-tertiary dark:text-dark-text-tertiary">Email</div>
              <div className="text-sm font-medium text-ink dark:text-dark-text">{invite!.email}</div>
            </div>
            <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full ${roleBadgeColor[invite!.role] || 'bg-gray-100 text-gray-700'}`}>
              {invite!.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input id="name" {...register('name')} className={inputClass} placeholder="Enter your full name" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="designation" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
              Designation <span className="text-ink-tertiary dark:text-dark-text-tertiary">(optional)</span>
            </label>
            <input id="designation" {...register('designation')} className={inputClass} placeholder="e.g. Branch Manager" />
          </div>

          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
              Mobile <span className="text-ink-tertiary dark:text-dark-text-tertiary">(optional)</span>
            </label>
            <input id="mobile" {...register('mobile')} className={inputClass} placeholder="+91 9876543210" />
            {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile.message}</p>}
          </div>

          {!otpStep && (
            <button
              type="submit"
              className="w-full px-6 py-2.5 rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors font-medium"
            >
              Continue
            </button>
          )}
        </form>

        {otpStep && (
          <div className="mt-6 pt-6 border-t border-sand-300 dark:border-dark-border">
            <p className="text-sm text-ink-secondary dark:text-dark-text-secondary mb-4 text-center">
              Enter the 6-digit code sent to <span className="font-medium text-ink dark:text-dark-text">{invite!.email}</span>
            </p>

            <div className="flex justify-center gap-2 mb-4" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-11 h-12 text-center text-lg font-semibold rounded-xl border border-sand-300 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent dark:bg-dark-surface dark:border-dark-border dark:text-dark-text"
                />
              ))}
            </div>

            {otpError && <p className="text-red-500 text-sm mb-3 text-center">{otpError}</p>}

            <button
              onClick={handleAccept}
              disabled={submitting || otp.join('').length !== OTP_LENGTH}
              className="w-full px-6 py-2.5 rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors font-medium disabled:opacity-50"
            >
              {submitting ? 'Accepting...' : 'Accept Invite'}
            </button>

            <div className="text-center mt-3 text-sm text-ink-secondary dark:text-dark-text-secondary">
              {resendTimer > 0 ? (
                <span>Resend OTP in {resendTimer}s</span>
              ) : (
                <button onClick={requestOtp} className="text-accent hover:underline font-medium">
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
