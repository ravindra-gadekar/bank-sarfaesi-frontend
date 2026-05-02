import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import { appAdminApi, type AppUser } from './api/appAdminApi';
import AppUserInviteModal from '../invites/AppUserInviteModal';

const APP_ROLE_BADGE: Record<string, string> = {
  superadmin: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  support: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
};

export default function AppUsersView() {
  const myAppRole = useAuthStore((s) => s.user?.appRole);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    appAdminApi
      .listAppUsers()
      .then(setUsers)
      .catch((err) => {
        const e = err as { response?: { data?: { message?: string } } };
        setError(e?.response?.data?.message ?? 'Failed to load users');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-ink dark:text-dark-text tracking-tight">
          App Users
        </h2>
        {myAppRole === 'superadmin' && (
          <button
            onClick={() => setShowInvite(true)}
            className="bg-accent text-white py-2.5 px-4 rounded-xl font-medium hover:bg-accent-hover transition-colors"
          >
            Invite App User
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>}

      <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl shadow-sm border border-sand-300 dark:border-dark-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 dark:border-dark-border text-left">
              <th className="px-6 py-3 font-medium text-ink-secondary dark:text-dark-text-secondary">Name</th>
              <th className="px-6 py-3 font-medium text-ink-secondary dark:text-dark-text-secondary">Email</th>
              <th className="px-6 py-3 font-medium text-ink-secondary dark:text-dark-text-secondary">Role</th>
              <th className="px-6 py-3 font-medium text-ink-secondary dark:text-dark-text-secondary">Status</th>
              <th className="px-6 py-3 font-medium text-ink-secondary dark:text-dark-text-secondary">Last Login</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-200 dark:divide-dark-border">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-sand-200 dark:bg-dark-border rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-ink-tertiary dark:text-dark-text-tertiary">
                  No app users yet.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="hover:bg-sand-100 dark:hover:bg-dark-bg/50 transition-colors">
                  <td className="px-6 py-4 text-ink dark:text-dark-text font-medium">{u.name}</td>
                  <td className="px-6 py-4 text-ink-secondary dark:text-dark-text-secondary">{u.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${APP_ROLE_BADGE[u.appRole] ?? 'bg-gray-100 text-gray-700'}`}
                    >
                      {u.appRole}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-ink-tertiary dark:text-dark-text-tertiary text-xs">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showInvite && (
        <AppUserInviteModal onClose={() => setShowInvite(false)} onSuccess={refresh} />
      )}
    </div>
  );
}
