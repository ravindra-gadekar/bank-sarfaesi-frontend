import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { noticeApi, NoticeData } from '../notices/api/noticeApi';

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Pending Review',
};

export default function PendingReviewList() {
  const [notices, setNotices] = useState<NoticeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    noticeApi.listPendingReview()
      .then(setNotices)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-ink dark:text-dark-text tracking-tight">Review Queue</h2>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-sand-200 dark:bg-dark-surface-hover rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-ink dark:text-dark-text mb-6 tracking-tight">Review Queue</h2>

      {notices.length === 0 ? (
        <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border p-10 text-center">
          <p className="text-ink-tertiary dark:text-dark-text-tertiary">No notices pending review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <Link
              key={n._id}
              to={`/notices/${n._id}/review`}
              className="block bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border p-5 hover:border-accent transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-ink dark:text-dark-text">
                      {n.noticeType === 'demand_13_2' ? 'Demand Notice §13(2)' :
                       n.noticeType === 'possession_13_4' ? 'Possession Notice §13(4)' :
                       'Sale Notice §8/9'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                      {STATUS_LABELS[n.status] || n.status}
                    </span>
                  </div>
                  <div className="text-sm text-ink-secondary dark:text-dark-text-secondary">
                    Submitted {n.submittedAt ? new Date(n.submittedAt).toLocaleDateString('en-IN') : ''} · {n.recipients?.length || 0} recipients
                  </div>
                </div>
                <span className="text-accent text-sm font-medium">Review →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
