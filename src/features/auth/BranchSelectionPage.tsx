import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from './api/authApi';
import type { AxiosError } from 'axios';

interface BranchInfo {
  branchId: string;
  branchName: string;
  bankName: string;
  role: string;
}

function getErrorMessage(err: unknown): string {
  const axErr = err as AxiosError<{ message?: string }>;
  if (axErr.response) return axErr.response.data?.message || 'Something went wrong.';
  return 'Network error. Please check your connection.';
}

export default function BranchSelectionPage() {
  const navigate = useNavigate();
  const { isAuthenticated, email, branches, setBranches, selectBranch, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  // Refresh branches from server on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchBranches() {
      try {
        const { data } = await authApi.myBranches();
        if (!cancelled) setBranches(data.data.branches);
      } catch {
        // Silently fail — use branches from auth store
      }
    }
    if (isAuthenticated) fetchBranches();
    return () => { cancelled = true; };
  }, [isAuthenticated, setBranches]);

  const handleSelectBranch = async (branch: BranchInfo) => {
    setError(null);
    setSelectingId(branch.branchId);
    setLoading(true);
    try {
      const { data } = await authApi.selectBranch(branch.branchId);
      selectBranch(data.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setSelectingId(null);
    }
  };

  const handleCreateBranch = () => {
    navigate('/onboarding');
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Still clear local state
    }
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-sand-100 dark:bg-dark-bg flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-ink dark:text-dark-text">Select Branch</h1>
          <p className="mt-2 text-sm text-ink-secondary dark:text-dark-text-secondary">
            Signed in as <span className="font-medium text-ink dark:text-dark-text">{email}</span>
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Branch list */}
        {branches.length > 0 && (
          <div className="space-y-3 mb-6">
            {branches.map((b) => (
              <button
                key={b.branchId}
                onClick={() => handleSelectBranch(b)}
                disabled={loading}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-sand-300 dark:border-dark-border bg-white dark:bg-dark-surface hover:bg-sand-50 dark:hover:bg-dark-surface-hover transition-colors text-left disabled:opacity-50"
              >
                {/* Icon */}
                <div className="shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink dark:text-dark-text truncate">{b.branchName}</p>
                  <p className="text-xs text-ink-tertiary dark:text-dark-text-tertiary truncate">
                    {b.bankName} &middot; {b.role}
                  </p>
                </div>

                {/* Loading or arrow */}
                {selectingId === b.branchId ? (
                  <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 text-ink-tertiary dark:text-dark-text-tertiary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}

        {/* No branches message */}
        {branches.length === 0 && (
          <div className="text-center mb-6 py-8 px-4 rounded-xl border border-dashed border-sand-300 dark:border-dark-border">
            <svg className="w-12 h-12 mx-auto text-ink-tertiary dark:text-dark-text-tertiary mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-ink-secondary dark:text-dark-text-secondary font-medium">No branches yet</p>
            <p className="text-xs text-ink-tertiary dark:text-dark-text-tertiary mt-1">
              Create your first branch to get started.
            </p>
          </div>
        )}

        {/* Create Branch button */}
        <button
          onClick={handleCreateBranch}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create New Branch
        </button>

        {/* Logout link */}
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
