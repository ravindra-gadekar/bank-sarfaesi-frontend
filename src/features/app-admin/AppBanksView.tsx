import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { appAdminApi, type BankSummary } from './api/appAdminApi';

export default function AppBanksView() {
  const [banks, setBanks] = useState<BankSummary[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appAdminApi
      .listBanks()
      .then(setBanks)
      .catch((err) => {
        const e = err as { response?: { data?: { message?: string } } };
        setError(e?.response?.data?.message ?? 'Failed to load banks');
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
      <h2 className="text-2xl font-semibold text-ink dark:text-dark-text tracking-tight mb-6">
        Banks
      </h2>

      {banks.length === 0 ? (
        <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-dashed border-sand-300 dark:border-dark-border p-8 text-center">
          <p className="text-ink-secondary dark:text-dark-text-secondary">
            No banks yet. Onboard the first one by inviting an HO admin.
          </p>
        </div>
      ) : (
        <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl shadow-sm border border-sand-300 dark:border-dark-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200 dark:border-dark-border text-left">
                <th className="px-6 py-3 font-medium text-ink-secondary dark:text-dark-text-secondary">Bank Name</th>
                <th className="px-6 py-3 font-medium text-ink-secondary dark:text-dark-text-secondary">City</th>
                <th className="px-6 py-3 font-medium text-ink-secondary dark:text-dark-text-secondary">Offices</th>
                <th className="px-6 py-3 font-medium text-ink-secondary dark:text-dark-text-secondary">Users</th>
                <th className="px-6 py-3 font-medium text-ink-secondary dark:text-dark-text-secondary">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200 dark:divide-dark-border">
              {banks.map((b) => (
                <tr key={b._id} className="hover:bg-sand-100 dark:hover:bg-dark-bg/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      to={`/banks/${b._id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {b.bankName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-ink-secondary dark:text-dark-text-secondary">
                    {b.city ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-ink dark:text-dark-text">{b.officeCount}</td>
                  <td className="px-6 py-4 text-ink dark:text-dark-text">{b.userCount}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        b.setupCompleted
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}
                    >
                      {b.setupCompleted ? 'Active' : 'Setup pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
