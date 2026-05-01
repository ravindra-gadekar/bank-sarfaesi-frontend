import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { caseApi, CaseData } from './api/caseApi';

export default function CaseListPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const result = await caseApi.list({
        page,
        limit: 15,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setCases(result.data);
      setTotalPages(result.pagination.totalPages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      closed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      archived: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || ''}`}>
        {status}
      </span>
    );
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-ink dark:text-dark-text tracking-tight">NPA Cases</h2>
        <button
          onClick={() => navigate('/cases/new')}
          className="bg-accent text-white py-2 px-4 rounded-xl text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          + New Case
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by account no or borrower..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 px-4 py-2 rounded-xl bg-sand-50 dark:bg-dark-surface border border-sand-300 dark:border-dark-border text-ink dark:text-dark-text text-sm placeholder:text-ink-tertiary dark:placeholder:text-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 rounded-xl bg-sand-50 dark:bg-dark-surface border border-sand-300 dark:border-dark-border text-ink dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-pulse space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-sand-200 dark:bg-dark-surface-hover rounded" />
              ))}
            </div>
          </div>
        ) : cases.length === 0 ? (
          <div className="p-12 text-center text-ink-tertiary dark:text-dark-text-tertiary">
            No cases found. Create your first NPA case to get started.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-300 dark:border-dark-border text-ink-tertiary dark:text-dark-text-tertiary text-left">
                <th className="px-4 py-3 font-medium">Account No</th>
                <th className="px-4 py-3 font-medium">Primary Borrower</th>
                <th className="px-4 py-3 font-medium">Loan Type</th>
                <th className="px-4 py-3 font-medium">Sanction Amount</th>
                <th className="px-4 py-3 font-medium">NPA Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200 dark:divide-dark-border">
              {cases.map((c) => {
                const primary = c.borrowers.find((b) => b.type === 'primary');
                return (
                  <tr
                    key={c._id}
                    onClick={() => navigate(`/cases/${c._id}`)}
                    className="hover:bg-sand-100 dark:hover:bg-dark-surface-hover cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-ink dark:text-dark-text">{c.accountNo}</td>
                    <td className="px-4 py-3 text-ink dark:text-dark-text">{primary?.name || '—'}</td>
                    <td className="px-4 py-3 text-ink-secondary dark:text-dark-text-secondary">{c.loanType}</td>
                    <td className="px-4 py-3 text-ink dark:text-dark-text">{formatCurrency(c.sanctionAmount)}</td>
                    <td className="px-4 py-3 text-ink-secondary dark:text-dark-text-secondary">{formatDate(c.npaDate)}</td>
                    <td className="px-4 py-3">{statusBadge(c.status)}</td>
                    <td className="px-4 py-3 text-ink-tertiary dark:text-dark-text-tertiary">{formatDate(c.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg text-sm bg-sand-50 dark:bg-dark-surface border border-sand-300 dark:border-dark-border disabled:opacity-40 hover:bg-sand-200 dark:hover:bg-dark-surface-hover transition-colors text-ink dark:text-dark-text"
          >
            Previous
          </button>
          <span className="text-sm text-ink-secondary dark:text-dark-text-secondary">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg text-sm bg-sand-50 dark:bg-dark-surface border border-sand-300 dark:border-dark-border disabled:opacity-40 hover:bg-sand-200 dark:hover:bg-dark-surface-hover transition-colors text-ink dark:text-dark-text"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
