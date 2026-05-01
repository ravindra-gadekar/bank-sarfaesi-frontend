import { useState } from 'react';
import { userApi } from './api/userApi';

const ROLES = ['admin', 'manager', 'maker', 'checker', 'auditor'] as const;

interface InviteUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function InviteUserModal({ onClose, onSuccess }: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('maker');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await userApi.createInvite(email, role);
      setSuccess(`Invite sent to ${email}`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(msg || 'Failed to send invite. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-sand-50 dark:bg-dark-surface rounded-2xl shadow-lg border border-sand-300 dark:border-dark-border p-6">
        <h3 className="text-lg font-semibold text-ink dark:text-dark-text mb-4">Invite User</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-ink-secondary dark:text-dark-text-secondary mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-sand-300 bg-white text-ink placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent dark:bg-dark-surface dark:border-dark-border dark:text-dark-text dark:placeholder:text-dark-text-tertiary"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-ink-secondary dark:text-dark-text-secondary mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-sand-300 bg-white text-ink placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent dark:bg-dark-surface dark:border-dark-border dark:text-dark-text dark:placeholder:text-dark-text-tertiary"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Messages */}
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="border border-sand-300 text-ink py-2.5 px-4 rounded-xl font-medium hover:bg-sand-200 transition-colors dark:border-dark-border dark:text-dark-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-accent text-white py-2.5 px-4 rounded-xl font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
