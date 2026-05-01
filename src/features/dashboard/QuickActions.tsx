import { Link } from 'react-router-dom';

interface Props {
  pendingReviewCount: number;
}

const actions = [
  {
    label: 'Create New Case',
    description: 'Start an NPA case and generate notices',
    href: '/cases/new',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
    color: 'text-accent',
  },
  {
    label: 'Pending Reviews',
    description: 'Notices awaiting approval',
    href: '/review',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-blue-600 dark:text-blue-400',
    badgeKey: 'pendingReviewCount' as const,
  },
  {
    label: 'Notice Registry',
    description: 'Browse all generated notices',
    href: '/registry',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    color: 'text-green-600 dark:text-green-400',
  },
];

export default function QuickActions({ pendingReviewCount }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {actions.map((action) => (
        <Link
          key={action.label}
          to={action.href}
          className="relative flex items-start gap-3 p-4 rounded-2xl border border-sand-300 dark:border-dark-border bg-sand-50 dark:bg-dark-surface hover:border-accent transition-colors"
        >
          <div className={`mt-0.5 ${action.color}`}>{action.icon}</div>
          <div>
            <p className="font-medium text-sm text-ink dark:text-dark-text">{action.label}</p>
            <p className="text-xs text-ink-tertiary dark:text-dark-text-tertiary mt-0.5">
              {action.description}
            </p>
          </div>
          {action.badgeKey && pendingReviewCount > 0 && (
            <span className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {pendingReviewCount}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
