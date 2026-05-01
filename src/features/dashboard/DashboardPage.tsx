import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, type DashboardStats, type RecentActivityItem } from './api/dashboardApi';
import RecentActivity from './RecentActivity';
import QuickActions from './QuickActions';

const NOTICE_TYPE_LABELS: Record<string, string> = {
  demand_13_2: '13(2) Demand',
  possession_13_4: '13(4) Possession',
  sale_auction: 'Sale / Auction',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-200 dark:bg-gray-700',
  submitted: 'bg-blue-200 dark:bg-blue-800',
  approved: 'bg-green-200 dark:bg-green-800',
  rejected: 'bg-red-200 dark:bg-red-800',
  final: 'bg-emerald-200 dark:bg-emerald-800',
  superseded: 'bg-yellow-200 dark:bg-yellow-800',
};

function BarChart({ data, colorClass }: { data: Record<string, number>; colorClass?: (key: string) => string }) {
  const maxVal = Math.max(...Object.values(data), 1);
  return (
    <div className="space-y-2">
      {Object.entries(data).map(([key, val]) => (
        <div key={key} className="flex items-center gap-3">
          <span className="text-xs text-ink-secondary dark:text-dark-text-secondary w-24 truncate capitalize">
            {key.replace(/_/g, ' ')}
          </span>
          <div className="flex-1 bg-sand-200 dark:bg-dark-surface-hover rounded-full h-5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${colorClass ? colorClass(key) : 'bg-accent'}`}
              style={{ width: `${(val / maxVal) * 100}%`, minWidth: val > 0 ? '1rem' : '0' }}
            />
          </div>
          <span className="text-xs font-medium text-ink dark:text-dark-text w-8 text-right">{val}</span>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ data }: { data: Array<{ month: string; count: number }> }) {
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const height = 120;
  return (
    <div className="flex items-end gap-2 h-[140px] pt-2">
      {data.map((d) => (
        <div key={d.month} className="flex-1 flex flex-col items-center justify-end h-full">
          <span className="text-[10px] text-ink-tertiary dark:text-dark-text-tertiary mb-1">{d.count}</span>
          <div
            className="w-full max-w-8 bg-accent rounded-t transition-all"
            style={{ height: `${(d.count / maxVal) * height}px`, minHeight: d.count > 0 ? 4 : 0 }}
          />
          <span className="text-[10px] text-ink-tertiary dark:text-dark-text-tertiary mt-1.5 truncate w-full text-center">
            {d.month.split(' ')[0]}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, a] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRecentActivity(),
        ]);
        setStats(s);
        setActivity(a);
      } catch {
        // fail silently — dashboard still renders with empty state
      }
      setLoading(false);
    };
    load();
  }, []);

  const kpiCards = [
    { label: 'Total Cases', value: stats?.totalCases ?? 0, href: '/cases', color: 'text-ink dark:text-dark-text' },
    { label: 'Notices This Month', value: stats?.noticesThisMonth ?? 0, href: '/registry', color: 'text-accent' },
    { label: 'Pending Reviews', value: stats?.pendingReviewCount ?? 0, href: '/review', color: 'text-blue-600 dark:text-blue-400' },
    {
      label: 'Avg. Approval Time',
      value: stats?.avgApprovalTimeHours !== null && stats?.avgApprovalTimeHours !== undefined
        ? `${stats.avgApprovalTimeHours}h`
        : '—',
      href: '/review',
      color: 'text-green-600 dark:text-green-400',
    },
  ];

  // Transform noticesByType for pie-like display
  const noticesByTypeLabeled = stats
    ? Object.fromEntries(
        Object.entries(stats.noticesByType).map(([k, v]) => [NOTICE_TYPE_LABELS[k] ?? k, v]),
      )
    : {};

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-ink dark:text-dark-text tracking-tight">Dashboard</h2>

      {/* Quick Actions */}
      <QuickActions pendingReviewCount={stats?.pendingReviewCount ?? 0} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Link
            key={card.label}
            to={card.href}
            className="bg-sand-50 dark:bg-dark-surface p-5 rounded-2xl border border-sand-300 dark:border-dark-border hover:border-accent transition-colors"
          >
            <p className="text-xs text-ink-tertiary dark:text-dark-text-tertiary">{card.label}</p>
            {loading ? (
              <div className="h-8 w-14 bg-sand-200 dark:bg-dark-surface-hover rounded animate-pulse mt-2" />
            ) : (
              <p className={`text-2xl font-semibold mt-1.5 ${card.color}`}>{card.value}</p>
            )}
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notices by Type */}
        <div className="bg-sand-50 dark:bg-dark-surface p-5 rounded-2xl border border-sand-300 dark:border-dark-border">
          <h3 className="text-sm font-medium text-ink dark:text-dark-text mb-4">Notices by Type</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 bg-sand-200 dark:bg-dark-surface-hover rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <BarChart data={noticesByTypeLabeled} />
          )}
        </div>

        {/* Notices by Status */}
        <div className="bg-sand-50 dark:bg-dark-surface p-5 rounded-2xl border border-sand-300 dark:border-dark-border">
          <h3 className="text-sm font-medium text-ink dark:text-dark-text mb-4">Notices by Status</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-5 bg-sand-200 dark:bg-dark-surface-hover rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <BarChart
              data={stats?.noticesByStatus ?? {}}
              colorClass={(key) => STATUS_COLORS[key] ?? 'bg-accent'}
            />
          )}
        </div>

        {/* Monthly Trend */}
        <div className="bg-sand-50 dark:bg-dark-surface p-5 rounded-2xl border border-sand-300 dark:border-dark-border">
          <h3 className="text-sm font-medium text-ink dark:text-dark-text mb-4">Monthly Trend (6 mo)</h3>
          {loading ? (
            <div className="h-[140px] bg-sand-200 dark:bg-dark-surface-hover rounded animate-pulse" />
          ) : (
            <TrendChart data={stats?.monthlyTrend ?? []} />
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-ink dark:text-dark-text">Recent Activity</h3>
          <Link to="/audit" className="text-xs text-accent hover:underline">View all →</Link>
        </div>
        <RecentActivity activity={activity} loading={loading} />
      </div>
    </div>
  );
}
