import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { inviteApi, type ValidateInviteResponse } from '../invites/api/inviteApi';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  designation: z.string().optional(),
  mobile: z
    .string()
    .regex(/^(\+91[\-\s]?)?[6-9]\d{9}$/, 'Enter a valid Indian mobile number')
    .or(z.literal(''))
    .optional(),
});

type FormData = z.infer<typeof schema>;

export default function InviteSignupPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [invite, setInvite] = useState<ValidateInviteResponse | null>(null);
  const [inviteError, setInviteError] = useState('');
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [acceptError, setAcceptError] = useState('');

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors },
  } = useForm<FormData>();

  useEffect(() => {
    if (!token) return;
    inviteApi
      .validateInvite(token)
      .then((data) => setInvite(data))
      .catch((err) => {
        const e = err as { response?: { data?: { message?: string } } };
        setInviteError(e?.response?.data?.message ?? 'This invite link is invalid or has expired.');
      })
      .finally(() => setLoadingInvite(false));
  }, [token]);

  const onSubmit = async (data: FormData) => {
    if (!token) return;
    const result = schema.safeParse(data);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormData;
        setFieldError(field, { message: issue.message });
      }
      return;
    }
    setSubmitting(true);
    setAcceptError('');
    try {
      await inviteApi.acceptInvite(token, {
        name: data.name,
        designation: data.designation || undefined,
        mobile: data.mobile || undefined,
      });
      navigate('/login');
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setAcceptError(e?.response?.data?.message ?? 'Failed to accept invite. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-sand-300 bg-white text-ink placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent dark:bg-dark-surface dark:border-dark-border dark:text-dark-text dark:placeholder:text-dark-text-tertiary';

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
          <h2 className="text-xl font-semibold text-ink dark:text-dark-text mb-2">Invalid Invite</h2>
          <p className="text-ink-secondary dark:text-dark-text-secondary mb-6">{inviteError}</p>
          <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary">
            Please contact your administrator for a new invitation.
          </p>
        </div>
      </div>
    );
  }

  const role = invite?.bankRole ?? invite?.appRole ?? '';
  const roleBadgeColor: Record<string, string> = {
    superadmin: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    maker: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    checker: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    auditor: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
    support: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  };

  return (
    <div className="min-h-screen bg-sand-100 dark:bg-dark-bg flex flex-col items-center justify-center px-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-ink dark:text-dark-text tracking-tight">Bank SARFAESI</h1>
        <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary mt-1">Accept Invitation</p>
      </div>

      <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl shadow-sm border border-sand-300 dark:border-dark-border p-8 w-full max-w-md">
        {invite && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-ink-tertiary dark:text-dark-text-tertiary">Email</div>
                <div className="text-sm font-medium text-ink dark:text-dark-text truncate">
                  {invite.email}
                </div>
              </div>
              {role && (
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleBadgeColor[role] || 'bg-gray-100 text-gray-700'}`}
                >
                  {role}
                </span>
              )}
            </div>
            <div className="text-sm text-ink-secondary dark:text-dark-text-secondary">
              Joining{' '}
              <strong className="text-ink dark:text-dark-text">
                {invite.bankName ?? (invite.userKind === 'app' ? 'the platform' : 'your office')}
              </strong>
              {invite.officeType && (
                <>
                  {' '}
                  as a{' '}
                  <span className="font-medium text-ink dark:text-dark-text">{invite.officeType}</span>
                </>
              )}{' '}
              {invite.userKind === 'app' ? 'app user' : 'bank user'}.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <input
              id="designation"
              {...register('designation')}
              className={inputClass}
              placeholder="e.g. Branch Manager"
            />
          </div>

          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
              Mobile <span className="text-ink-tertiary dark:text-dark-text-tertiary">(optional)</span>
            </label>
            <input id="mobile" {...register('mobile')} className={inputClass} placeholder="+91 9876543210" />
            {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile.message}</p>}
          </div>

          {acceptError && <p className="text-red-500 text-sm">{acceptError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-2.5 rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors font-medium disabled:opacity-50"
          >
            {submitting ? 'Accepting…' : 'Accept Invite'}
          </button>
        </form>
      </div>
    </div>
  );
}
