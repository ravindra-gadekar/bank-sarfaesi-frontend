interface DateChainBadgeProps {
  demandNoticeDate: string;
  possessionDate: string;
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((b.getTime() - a.getTime()) / msPerDay);
}

const REQUIRED_GAP_DAYS = 60;

export default function DateChainBadge({ demandNoticeDate, possessionDate }: DateChainBadgeProps) {
  if (!demandNoticeDate || !possessionDate) {
    return (
      <div className="flex items-center gap-2 text-xs text-ink-tertiary dark:text-dark-text-tertiary bg-sand-100 dark:bg-dark-surface rounded-lg px-3 py-2">
        <span>13(2) Date</span>
        <span className="text-sand-400">→</span>
        <span className="text-sand-400">60 days min</span>
        <span className="text-sand-400">→</span>
        <span>13(4) Possession</span>
        <span className="text-sand-400 ml-2">— Set both dates to see validation</span>
      </div>
    );
  }

  const demandDate = new Date(demandNoticeDate);
  const possDate = new Date(possessionDate);
  const gap = daysBetween(demandDate, possDate);
  const isValid = gap >= REQUIRED_GAP_DAYS;

  return (
    <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${
      isValid
        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
    }`}>
      <span className="font-medium">13(2)</span>
      <span>{demandDate.toLocaleDateString('en-IN')}</span>
      <span>→</span>
      <span className="font-semibold">{gap} days</span>
      <span>→</span>
      <span className="font-medium">13(4)</span>
      <span>{possDate.toLocaleDateString('en-IN')}</span>
      <span className="ml-2 font-semibold">
        {isValid ? '✓ Valid' : `✗ Minimum ${REQUIRED_GAP_DAYS} required`}
      </span>
    </div>
  );
}
