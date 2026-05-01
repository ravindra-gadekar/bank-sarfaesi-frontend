import type { RecentActivityItem } from './api/dashboardApi';

const ACTION_LABELS: Record<string, string> = {
  create: 'created',
  update: 'updated',
  submit: 'submitted',
  approve: 'approved',
  reject: 'rejected',
  supersede: 'superseded',
  delete: 'deleted',
  invite: 'invited',
  login: 'logged in',
};

const ENTITY_LABELS: Record<string, string> = {
  case: 'case',
  notice: 'notice',
  user: 'user',
  branch: 'branch',
  chatFlowConfig: 'chat flow config',
};

function formatAction(item: RecentActivityItem): string {
  const action = ACTION_LABELS[item.action] ?? item.action;
  const entity = ENTITY_LABELS[item.entity] ?? item.entity;
  return `${action} a ${entity}`;
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface Props {
  activity: RecentActivityItem[];
  loading: boolean;
}

export default function RecentActivity({ activity, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-sand-200 dark:bg-dark-surface-hover rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (activity.length === 0) {
    return (
      <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary py-6 text-center">
        No recent activity.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {activity.map((item) => (
        <div
          key={item._id}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-sand-100 dark:hover:bg-dark-surface-hover transition-colors"
        >
          <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-ink dark:text-dark-text truncate">
              {formatAction(item)}
            </p>
          </div>
          <span className="text-xs text-ink-tertiary dark:text-dark-text-tertiary whitespace-nowrap">
            {timeAgo(item.timestamp)}
          </span>
        </div>
      ))}
    </div>
  );
}
