import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { appAdminApi, type AppStats } from './api/appAdminApi';

export default function AppDashboardView() {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appAdminApi
      .getStats()
      .then(setStats)
      .catch((err) => {
        const e = err as { response?: { data?: { message?: string } } };
        setError(e?.response?.data?.message ?? 'Failed to load stats');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-ink-secondary dark:text-dark-text-secondary">Loading…</div>;
  }
  if (error) {
    return <div className="text-red-600 dark:text-red-400">{error}</div>;
  }
  if (!stats) return null;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-ink dark:text-dark-text tracking-tight">
        App Admin Dashboard
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Stat label="Banks" value={stats.totalBanks} />
        <Stat label="Offices" value={stats.totalOffices} />
        <Stat label="App Users" value={stats.totalAppUsers} />
        <Stat label="Bank Users" value={stats.totalBankUsers} />
        <Stat label="Pending Invites" value={stats.pendingInvites} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/banks"
          className="px-4 py-2.5 rounded-xl bg-accent text-white hover:bg-accent-hover font-medium transition-colors"
        >
          View Banks
        </Link>
        <Link
          to="/users"
          className="px-4 py-2.5 rounded-xl border border-sand-300 dark:border-dark-border text-ink dark:text-dark-text hover:bg-sand-100 dark:hover:bg-dark-surface-hover font-medium"
        >
          App Users
        </Link>
        <Link
          to="/audit-logs"
          className="px-4 py-2.5 rounded-xl border border-sand-300 dark:border-dark-border text-ink dark:text-dark-text hover:bg-sand-100 dark:hover:bg-dark-surface-hover font-medium"
        >
          Audit Feed
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-5 bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border">
      <div className="text-xs text-ink-tertiary dark:text-dark-text-tertiary">{label}</div>
      <div className="text-3xl font-semibold mt-1.5 text-ink dark:text-dark-text">{value}</div>
    </div>
  );
}
