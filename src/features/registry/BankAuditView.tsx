import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';

interface AuditEntry {
  _id: string;
  branchId: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  timestamp: string;
}

export default function BankAuditView() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  useEffect(() => {
    setLoading(true);
    apiClient
      .get<{ success: boolean; data: { logs: AuditEntry[]; total: number; page: number; limit: number; totalPages: number } }>(
        '/audit-logs',
        { params: { page, limit } },
      )
      .then((res) => {
        setLogs(res.data.data.logs);
        setTotal(res.data.data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-ink dark:text-dark-text mb-6 tracking-tight">Audit Log</h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-sand-200 dark:bg-dark-surface-hover rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border p-10 text-center">
          <p className="text-ink-tertiary dark:text-dark-text-tertiary">No audit log entries yet.</p>
        </div>
      ) : (
        <>
          <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand-300 dark:border-dark-border text-left">
                  <th scope="col" className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">Time</th>
                  <th scope="col" className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">User</th>
                  <th scope="col" className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">Action</th>
                  <th scope="col" className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">Resource</th>
                  <th scope="col" className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b border-sand-200 dark:border-dark-border last:border-0">
                    <td className="px-5 py-3 text-ink-secondary dark:text-dark-text-secondary whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3 font-medium text-ink dark:text-dark-text">{log.userName}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          log.action.includes('create')
                            ? 'bg-green-100 text-green-700'
                            : log.action.includes('update')
                            ? 'bg-blue-100 text-blue-700'
                            : log.action.includes('delete')
                            ? 'bg-red-100 text-red-700'
                            : log.action.includes('approve')
                            ? 'bg-green-100 text-green-700'
                            : log.action.includes('reject')
                            ? 'bg-red-100 text-red-700'
                            : 'bg-sand-200 text-ink-secondary'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-secondary dark:text-dark-text-secondary">
                      {log.resource}
                      {log.resourceId ? ` #${log.resourceId.slice(-6)}` : ''}
                    </td>
                    <td className="px-5 py-3 text-ink-tertiary dark:text-dark-text-tertiary text-xs max-w-xs truncate">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm bg-sand-200 dark:bg-dark-surface text-ink dark:text-dark-text hover:bg-sand-300 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-ink-secondary dark:text-dark-text-secondary">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm bg-sand-200 dark:bg-dark-surface text-ink dark:text-dark-text hover:bg-sand-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
