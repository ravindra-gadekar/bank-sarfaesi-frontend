import { NoticeData } from '../notices/api/noticeApi';

interface Props {
  notice: NoticeData;
}

export default function NoticeTimeline({ notice }: Props) {
  const events: Array<{ status: string; date: string | undefined; label: string }> = [
    { status: 'draft', date: notice.createdAt, label: 'Draft Created' },
    { status: 'submitted', date: notice.submittedAt, label: 'Submitted for Review' },
  ];

  if (notice.status === 'rejected') {
    events.push({ status: 'rejected', date: notice.rejectedAt, label: `Rejected${notice.checkerComment ? `: ${notice.checkerComment}` : ''}` });
  } else if (notice.approvedAt || notice.status === 'approved' || notice.status === 'final') {
    events.push({ status: 'approved', date: notice.approvedAt, label: 'Approved' });
  }

  if (notice.finalizedAt) {
    events.push({ status: 'final', date: notice.finalizedAt, label: 'Finalized & Documents Generated' });
  }

  return (
    <div className="space-y-0">
      {events.map((event, i) => {
        const isComplete = !!event.date;
        const isCurrent = event.status === notice.status;
        const isRejected = event.status === 'rejected';

        return (
          <div key={i} className="flex gap-3">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full border-2 mt-1.5 ${
                isRejected ? 'border-red-500 bg-red-500' :
                isComplete ? 'border-green-500 bg-green-500' :
                isCurrent ? 'border-accent bg-accent' :
                'border-sand-400 dark:border-dark-border bg-transparent'
              }`} />
              {i < events.length - 1 && (
                <div className={`w-0.5 flex-1 min-h-[24px] ${
                  isComplete ? 'bg-green-300 dark:bg-green-800' : 'bg-sand-300 dark:bg-dark-border'
                }`} />
              )}
            </div>
            {/* Content */}
            <div className="pb-4">
              <p className={`text-sm font-medium ${
                isRejected ? 'text-red-600' :
                isComplete ? 'text-ink dark:text-dark-text' :
                'text-ink-tertiary dark:text-dark-text-tertiary'
              }`}>
                {event.label}
              </p>
              {event.date && (
                <p className="text-xs text-ink-tertiary dark:text-dark-text-tertiary">
                  {new Date(event.date).toLocaleString('en-IN')}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
