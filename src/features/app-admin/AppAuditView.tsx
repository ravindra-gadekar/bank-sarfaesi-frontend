import { useEffect, useState } from 'react';
import { appAdminApi, type AuditFeedEntry } from './api/appAdminApi';

export default function AppAuditView() {
  const [feed, setFeed] = useState<AuditFeedEntry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appAdminApi
      .listAuditFeed(200)
      .then(setFeed)
      .catch((err) => {
        const e = err as { response?: { data?: { message?: string } } };
        setError(e?.response?.data?.message ?? 'Failed to load feed');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-ink-secondary dark:text-dark-text-secondary">Loading…</div>;
  }
  if (error) {
    return <div className="text-red-600 dark:text-red-400">{error}</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-ink dark:text-dark-text mb-6 tracking-tight">
        System Audit Feed
      </h2>

      <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl shadow-sm border border-sand-300 dark:border-dark-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 dark:border-dark-border text-left">
              <th className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">When</th>
              <th className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">Action</th>
              <th className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">Entity</th>
              <th className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">User</th>
              <th className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">Branch</th>
              <th className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-200 dark:divide-dark-border">
            {feed.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-ink-tertiary dark:text-dark-text-tertiary">
                  No audit events yet.
                </td>
              </tr>
            ) : (
              feed.map((a) => (
                <tr key={a._id} className="hover:bg-sand-100 dark:hover:bg-dark-bg/50 transition-colors">
                  <td className="px-5 py-3 text-ink-secondary dark:text-dark-text-secondary whitespace-nowrap">
                    {new Date(a.timestamp).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-ink dark:text-dark-text">{a.action}</td>
                  <td className="px-5 py-3 text-ink-secondary dark:text-dark-text-secondary">
                    {a.entity}
                    {a.entityId ? `:${a.entityId.slice(-6)}` : ''}
                  </td>
                  <td className="px-5 py-3 text-ink-tertiary dark:text-dark-text-tertiary font-mono text-xs">
                    {a.userId.slice(-6)}
                  </td>
                  <td className="px-5 py-3 text-ink-tertiary dark:text-dark-text-tertiary font-mono text-xs">
                    {a.branchId.slice(-6)}
                  </td>
                  <td className="px-5 py-3 text-ink-tertiary dark:text-dark-text-tertiary text-xs">
                    {a.ipAddress ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
