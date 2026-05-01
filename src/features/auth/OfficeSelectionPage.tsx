import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, type OfficeSummary } from '../../store/authStore';
import { authApi } from './api/authApi';
import type { AxiosError } from 'axios';

function getErrorMessage(err: unknown): string {
  const axErr = err as AxiosError<{ message?: string }>;
  if (axErr.response) return axErr.response.data?.message || 'Something went wrong.';
  return 'Network error. Please check your connection.';
}

const officeTypeBadge: Record<OfficeSummary['officeType'], string> = {
  HO: 'Head Office',
  Zonal: 'Zonal',
  Regional: 'Regional',
  Branch: 'Branch',
};

export default function OfficeSelectionPage() {
  const navigate = useNavigate();
  const { isAuthenticated, email, offices, setOffices, selectOffice, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    let cancelled = false;
    async function fetchOffices() {
      try {
        const { data } = await authApi.myOffices();
        if (!cancelled) {
          const list: OfficeSummary[] = (data.data.branches ?? []).map((b: any) => ({
            officeId: b.branchId,
            bankName: b.bankName ?? '',
            branchName: b.branchName,
            officeType: b.officeType ?? 'Branch',
            bankRootId: b.bankRootId ?? b.branchId,
            role: b.role ?? '',
          }));
          setOffices(list);
        }
      } catch {
        // Fall back to whatever the store already has
      }
    }
    if (isAuthenticated) fetchOffices();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, setOffices]);

  const groupedByBank = useMemo(() => {
    const groups: Record<string, OfficeSummary[]> = {};
    for (const o of offices) {
      const key = o.bankName || 'Unknown bank';
      (groups[key] ??= []).push(o);
    }
    return groups;
  }, [offices]);

  const handleSelect = async (office: OfficeSummary) => {
    setError(null);
    setSelectingId(office.officeId);
    setLoading(true);
    try {
      const { data } = await authApi.selectOffice(office.officeId);
      selectOffice(office.officeId, data.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setSelectingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore — clear local state anyway
    }
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-sand-100 dark:bg-dark-bg flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-ink dark:text-dark-text">Select office</h1>
          <p className="mt-2 text-sm text-ink-secondary dark:text-dark-text-secondary">
            Signed in as <span className="font-medium text-ink dark:text-dark-text">{email}</span>
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {Object.keys(groupedByBank).length > 0 ? (
          Object.entries(groupedByBank).map(([bankName, list]) => (
            <section key={bankName} className="mb-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-tertiary dark:text-dark-text-tertiary mb-2">
                {bankName}
              </h2>
              <div className="space-y-3">
                {list.map((o) => (
                  <button
                    key={o.officeId}
                    onClick={() => handleSelect(o)}
                    disabled={loading}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-sand-300 dark:border-dark-border bg-white dark:bg-dark-surface hover:bg-sand-50 dark:hover:bg-dark-surface-hover transition-colors text-left disabled:opacity-50"
                  >
                    <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-accent/10 text-accent">
                      {officeTypeBadge[o.officeType]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink dark:text-dark-text truncate">
                        {o.branchName || o.bankName}
                      </p>
                      <p className="text-xs text-ink-tertiary dark:text-dark-text-tertiary truncate">
                        {o.role}
                      </p>
                    </div>
                    {selectingId === o.officeId ? (
                      <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 text-ink-tertiary dark:text-dark-text-tertiary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="text-center mb-6 py-8 px-4 rounded-xl border border-dashed border-sand-300 dark:border-dark-border">
            <p className="text-ink-secondary dark:text-dark-text-secondary font-medium">
              No offices linked to this account
            </p>
            <p className="text-xs text-ink-tertiary dark:text-dark-text-tertiary mt-1">
              Please ask your administrator to send you an invite.
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={handleLogout}
            className="text-sm text-ink-tertiary dark:text-dark-text-tertiary hover:text-ink dark:hover:text-dark-text transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
