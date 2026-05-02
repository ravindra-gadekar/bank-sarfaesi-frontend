import { useState, type FormEvent } from 'react';
import { inviteApi, type AppRole } from './api/inviteApi';

const APP_ROLES: AppRole[] = ['admin', 'support'];

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AppUserInviteModal({ onClose, onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [appRole, setAppRole] = useState<AppRole>('admin');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await inviteApi.createAppInvite(email, appRole);
      setSuccess(`Invite sent to ${email}`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Failed to send invite');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-sand-50 dark:bg-dark-surface rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-ink dark:text-dark-text">Invite App User</h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="app-invite-email" className="block text-sm font-medium mb-1 text-ink dark:text-dark-text">
              Email
            </label>
            <input
              id="app-invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-sand-300 bg-white dark:bg-dark-bg dark:border-dark-border dark:text-dark-text"
            />
          </div>
          <div>
            <label htmlFor="app-invite-role" className="block text-sm font-medium mb-1 text-ink dark:text-dark-text">
              Role
            </label>
            <select
              id="app-invite-role"
              value={appRole}
              onChange={(e) => setAppRole(e.target.value as AppRole)}
              className="w-full px-4 py-2.5 rounded-xl border border-sand-300 bg-white dark:bg-dark-bg dark:border-dark-border dark:text-dark-text"
            >
              {APP_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-sand-300 dark:border-dark-border text-ink dark:text-dark-text py-2.5 px-4 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-accent text-white py-2.5 px-4 rounded-xl disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
