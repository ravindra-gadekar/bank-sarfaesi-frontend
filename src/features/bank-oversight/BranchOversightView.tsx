import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  bankOversightApi,
  type BranchCase,
  type BranchNotice,
} from './api/bankOversightApi';

export default function BranchOversightView() {
  const { branchId } = useParams<{ branchId: string }>();
  const [cases, setCases] = useState<BranchCase[]>([]);
  const [notices, setNotices] = useState<BranchNotice[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!branchId) return;
    Promise.all([
      bankOversightApi.listBranchCases(branchId),
      bankOversightApi.listBranchNotices(branchId),
    ])
      .then(([c, n]) => {
        setCases(c);
        setNotices(n);
      })
      .catch((err) => {
        const e = err as { response?: { data?: { message?: string } } };
        setError(e?.response?.data?.message ?? 'Failed to load branch');
      })
      .finally(() => setLoading(false));
  }, [branchId]);

  if (loading) {
    return <div className="text-ink-secondary dark:text-dark-text-secondary">Loading…</div>;
  }
  if (error) {
    return <div className="text-red-600 dark:text-red-400">{error}</div>;
  }

  return (
    <div>
      <Link to="/bank-tree" className="text-sm text-accent hover:underline">
        ← Tree
      </Link>
      <h2 className="text-2xl font-semibold text-ink dark:text-dark-text tracking-tight mt-2 mb-6">
        Branch Oversight
      </h2>

      <section className="mb-8">
        <h3 className="text-sm font-medium text-ink dark:text-dark-text mb-3">
          Cases ({cases.length})
        </h3>
        <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200 dark:border-dark-border text-left">
                <th className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">Account No</th>
                <th className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">Borrower</th>
                <th className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">Sanction Amount</th>
                <th className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200 dark:divide-dark-border">
              {cases.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-ink-tertiary dark:text-dark-text-tertiary">
                    No cases.
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr key={c._id}>
                    <td className="px-5 py-3 text-ink dark:text-dark-text font-medium">{c.accountNo}</td>
                    <td className="px-5 py-3 text-ink-secondary dark:text-dark-text-secondary">
                      {c.borrowers?.[0]?.name ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-ink-secondary dark:text-dark-text-secondary">
                      {c.sanctionAmount ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-ink-secondary dark:text-dark-text-secondary">{c.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-ink dark:text-dark-text mb-3">
          Notices ({notices.length})
        </h3>
        <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200 dark:border-dark-border text-left">
                <th className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">Type</th>
                <th className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200 dark:divide-dark-border">
              {notices.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-ink-tertiary dark:text-dark-text-tertiary">
                    No notices.
                  </td>
                </tr>
              ) : (
                notices.map((n) => (
                  <tr key={n._id}>
                    <td className="px-5 py-3 text-ink dark:text-dark-text font-medium">{n.noticeType}</td>
                    <td className="px-5 py-3 text-ink-secondary dark:text-dark-text-secondary">{n.status}</td>
                    <td className="px-5 py-3 text-ink-tertiary dark:text-dark-text-tertiary text-xs">
                      {new Date(n.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
