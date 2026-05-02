import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bankOversightApi, type SubtreeOffice } from './api/bankOversightApi';

const TYPE_ORDER = ['HO', 'Zonal', 'Regional', 'Branch'] as const;

export default function SubtreeView() {
  const [offices, setOffices] = useState<SubtreeOffice[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bankOversightApi
      .listSubtreeOffices()
      .then(setOffices)
      .catch((err) => {
        const e = err as { response?: { data?: { message?: string } } };
        setError(e?.response?.data?.message ?? 'Failed to load tree');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-ink-secondary dark:text-dark-text-secondary">Loading…</div>;
  }
  if (error) {
    return <div className="text-red-600 dark:text-red-400">{error}</div>;
  }

  const byType: Record<string, SubtreeOffice[]> = {};
  for (const o of offices) (byType[o.officeType] ??= []).push(o);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-ink dark:text-dark-text tracking-tight mb-6">
        Office Tree
      </h2>

      {offices.length === 0 ? (
        <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-dashed border-sand-300 dark:border-dark-border p-8 text-center">
          <p className="text-ink-secondary dark:text-dark-text-secondary">
            No offices in your subtree yet.
          </p>
        </div>
      ) : (
        TYPE_ORDER.map((t) => {
          const list = byType[t] ?? [];
          if (list.length === 0) return null;
          return (
            <section key={t} className="mb-6">
              <h3 className="text-sm font-medium text-ink dark:text-dark-text mb-3">
                {t} ({list.length})
              </h3>
              <ul className="space-y-2 bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border p-4">
                {list.map((o) => (
                  <li key={o._id} className="text-sm">
                    {o.officeType === 'Branch' ? (
                      <Link
                        to={`/bank-tree/${o._id}`}
                        className="font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded"
                      >
                        {o.branchName ?? o.bankName}
                      </Link>
                    ) : (
                      <span className="font-medium text-ink dark:text-dark-text">
                        {o.branchName ?? o.bankName}
                      </span>
                    )}
                    <span className="text-ink-secondary dark:text-dark-text-secondary">
                      {' — '}
                      {o.address}
                      {o.city ? `, ${o.city}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
