interface NoticeDateChainProps {
  demandNoticeDate?: string;
  possessionDate?: string;
  saleNoticeDate?: string;
  auctionDate?: string;
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((b.getTime() - a.getTime()) / msPerDay);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN');
  } catch {
    return '—';
  }
}

interface GapSegmentProps {
  fromDate: string;
  toDate: string;
  requiredDays: number;
  label: string;
}

function GapSegment({ fromDate, toDate, requiredDays, label }: GapSegmentProps) {
  if (!fromDate || !toDate) {
    return (
      <div className="flex items-center gap-1 text-sand-400">
        <span className="w-8 border-t border-dashed border-sand-400" />
        <span className="text-[10px]">{label}</span>
        <span className="w-8 border-t border-dashed border-sand-400" />
      </div>
    );
  }

  const gap = daysBetween(new Date(fromDate), new Date(toDate));
  const isValid = gap >= requiredDays;

  return (
    <div className={`flex items-center gap-1 ${isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
      <span className={`w-6 border-t-2 ${isValid ? 'border-green-500' : 'border-red-500'}`} />
      <span className="text-[10px] font-semibold whitespace-nowrap">
        {gap}d {isValid ? '✓' : `✗ (min ${requiredDays})`}
      </span>
      <span className={`w-6 border-t-2 ${isValid ? 'border-green-500' : 'border-red-500'}`} />
    </div>
  );
}

export default function NoticeDateChain({ demandNoticeDate, possessionDate, saleNoticeDate, auctionDate }: NoticeDateChainProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg bg-sand-100 dark:bg-dark-surface border border-sand-300 dark:border-dark-border px-3 py-2 text-xs">
      {/* 13(2) */}
      <div className="flex flex-col items-center">
        <span className="font-semibold text-ink dark:text-dark-text">13(2)</span>
        <span className="text-ink-tertiary dark:text-dark-text-tertiary">
          {demandNoticeDate ? formatDate(demandNoticeDate) : '—'}
        </span>
      </div>

      {/* Gap: 13(2) → 13(4) */}
      <GapSegment
        fromDate={demandNoticeDate || ''}
        toDate={possessionDate || ''}
        requiredDays={60}
        label="60d min"
      />

      {/* 13(4) */}
      <div className="flex flex-col items-center">
        <span className="font-semibold text-ink dark:text-dark-text">13(4)</span>
        <span className="text-ink-tertiary dark:text-dark-text-tertiary">
          {possessionDate ? formatDate(possessionDate) : '—'}
        </span>
      </div>

      {/* Gap: Sale Notice → Auction */}
      <GapSegment
        fromDate={saleNoticeDate || ''}
        toDate={auctionDate || ''}
        requiredDays={30}
        label="30d min"
      />

      {/* Sale/Auction */}
      <div className="flex flex-col items-center">
        <span className="font-semibold text-ink dark:text-dark-text">Auction</span>
        <span className="text-ink-tertiary dark:text-dark-text-tertiary">
          {auctionDate ? formatDate(auctionDate) : '—'}
        </span>
      </div>
    </div>
  );
}
