import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { appAdminApi, type OfficeNode } from './api/appAdminApi';

const OFFICE_TYPE_ORDER = ['HO', 'Zonal', 'Regional', 'Branch'] as const;

export default function AppBankDetailView() {
  const { bankRootId } = useParams<{ bankRootId: string }>();
  const [tree, setTree] = useState<OfficeNode[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bankRootId) return;
    appAdminApi
      .getBankTree(bankRootId)
      .then(setTree)
      .catch((err) => {
        const e = err as { response?: { data?: { message?: string } } };
        setError(e?.response?.data?.message ?? 'Failed to load tree');
      })
      .finally(() => setLoading(false));
  }, [bankRootId]);

  if (loading) {
    return <div className="text-ink-secondary dark:text-dark-text-secondary">Loading…</div>;
  }
  if (error) {
    return <div className="text-red-600 dark:text-red-400">{error}</div>;
  }

  const byType: Record<string, OfficeNode[]> = {};
  for (const o of tree) (byType[o.officeType] ??= []).push(o);

  return (
    <div>
      <Link to="/banks" className="text-sm text-accent hover:underline">
        ← All banks
      </Link>
      <h2 className="text-2xl font-semibold text-ink dark:text-dark-text tracking-tight mt-2 mb-6">
        {tree[0]?.bankName ?? 'Bank'}
      </h2>
      {OFFICE_TYPE_ORDER.map((t) => (
        <section key={t} className="mb-6">
          <h3 className="text-sm font-medium text-ink dark:text-dark-text mb-3">
            {t} Offices ({byType[t]?.length ?? 0})
          </h3>
          {(byType[t]?.length ?? 0) === 0 ? (
            <p className="text-xs text-ink-tertiary dark:text-dark-text-tertiary pl-4">— none —</p>
          ) : (
            <ul className="space-y-2 bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border p-4">
              {(byType[t] ?? []).map((o) => (
                <li key={o._id} className="text-sm">
                  <span className="font-medium text-ink dark:text-dark-text">
                    {o.branchName ?? o.bankName}
                  </span>
                  <span className="text-ink-secondary dark:text-dark-text-secondary">
                    {' — '}
                    {o.address}
                    {o.city ? `, ${o.city}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
