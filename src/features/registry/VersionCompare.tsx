import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { noticeApi, NoticeData } from '../notices/api/noticeApi';

const FIELD_LABELS: Record<string, string> = {
  noticeDate: 'Notice Date',
  outstandingPrincipal: 'Outstanding Principal',
  outstandingInterest: 'Outstanding Interest',
  otherCharges: 'Other Charges',
  totalAmountDemanded: 'Total Amount Demanded',
  repaymentDeadline: 'Repayment Deadline',
  authorizedOfficerName: 'Authorized Officer Name',
  authorizedOfficerDesignation: 'AO Designation',
  placeOfNotice: 'Place of Notice',
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number')
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value);
  if (typeof value === 'string' && !isNaN(Date.parse(value)) && value.includes('T'))
    return new Date(value).toLocaleDateString('en-IN');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default function VersionCompare() {
  const [searchParams] = useSearchParams();
  const leftId = searchParams.get('left');
  const rightId = searchParams.get('right');

  const [leftNotice, setLeftNotice] = useState<NoticeData | null>(null);
  const [rightNotice, setRightNotice] = useState<NoticeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!leftId || !rightId) {
      setError('Both "left" and "right" notice IDs are required as query params.');
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([noticeApi.getById(leftId), noticeApi.getById(rightId)])
      .then(([l, r]) => {
        setLeftNotice(l);
        setRightNotice(r);
      })
      .catch(() => setError('Failed to load notices for comparison.'))
      .finally(() => setLoading(false));
  }, [leftId, rightId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-sand-200 dark:bg-dark-surface-hover rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!leftNotice || !rightNotice) return null;

  // Collect all unique field keys
  const allKeys = Array.from(
    new Set([
      ...Object.keys(leftNotice.fields),
      ...Object.keys(rightNotice.fields),
    ]),
  ).sort();

  const changedKeys = allKeys.filter((key) => {
    const lv = JSON.stringify(leftNotice.fields[key] ?? null);
    const rv = JSON.stringify(rightNotice.fields[key] ?? null);
    return lv !== rv;
  });

  const unchangedKeys = allKeys.filter((key) => !changedKeys.includes(key));

  return (
    <div>
      <h2 className="text-2xl font-semibold text-ink dark:text-dark-text mb-2 tracking-tight">
        Version Comparison
      </h2>
      <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary mb-6">
        v{leftNotice.version} vs v{rightNotice.version} &middot;{' '}
        {changedKeys.length} field{changedKeys.length !== 1 ? 's' : ''} changed
      </p>

      {/* Header row */}
      <div className="grid grid-cols-[200px_1fr_1fr] bg-sand-100 dark:bg-dark-surface rounded-t-2xl border border-sand-300 dark:border-dark-border">
        <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-secondary dark:text-dark-text-secondary">
          Field
        </div>
        <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-secondary dark:text-dark-text-secondary border-l border-sand-300 dark:border-dark-border">
          v{leftNotice.version} (Older)
        </div>
        <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-secondary dark:text-dark-text-secondary border-l border-sand-300 dark:border-dark-border">
          v{rightNotice.version} (Newer)
        </div>
      </div>

      {/* Changed fields */}
      {changedKeys.length > 0 && (
        <div className="border-x border-sand-300 dark:border-dark-border">
          {changedKeys.map((key) => {
            const lv = formatValue(leftNotice.fields[key]);
            const rv = formatValue(rightNotice.fields[key]);
            return (
              <div
                key={key}
                className="grid grid-cols-[200px_1fr_1fr] border-b border-sand-300 dark:border-dark-border bg-amber-50/50 dark:bg-amber-900/10"
              >
                <div className="px-4 py-3 text-sm font-medium text-ink dark:text-dark-text">
                  {FIELD_LABELS[key] || key}
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 uppercase font-semibold">
                    changed
                  </span>
                </div>
                <div className="px-4 py-3 text-sm text-red-600 dark:text-red-400 line-through border-l border-sand-300 dark:border-dark-border">
                  {lv}
                </div>
                <div className="px-4 py-3 text-sm text-green-700 dark:text-green-400 font-medium border-l border-sand-300 dark:border-dark-border">
                  {rv}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unchanged fields */}
      {unchangedKeys.length > 0 && (
        <div className="border-x border-sand-300 dark:border-dark-border">
          {unchangedKeys.map((key) => {
            const v = formatValue(leftNotice.fields[key]);
            return (
              <div
                key={key}
                className="grid grid-cols-[200px_1fr_1fr] border-b border-sand-300 dark:border-dark-border"
              >
                <div className="px-4 py-3 text-sm text-ink-secondary dark:text-dark-text-secondary">
                  {FIELD_LABELS[key] || key}
                </div>
                <div className="px-4 py-3 text-sm text-ink-tertiary dark:text-dark-text-tertiary border-l border-sand-300 dark:border-dark-border">
                  {v}
                </div>
                <div className="px-4 py-3 text-sm text-ink-tertiary dark:text-dark-text-tertiary border-l border-sand-300 dark:border-dark-border">
                  {v}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom border */}
      <div className="h-0 border-b border-sand-300 dark:border-dark-border rounded-b-2xl" />

      {/* Meta comparison */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border p-4">
          <h3 className="text-xs font-semibold uppercase text-ink-secondary dark:text-dark-text-secondary mb-2">
            Version {leftNotice.version}
          </h3>
          <p className="text-sm text-ink dark:text-dark-text">Status: <span className="font-medium">{leftNotice.status}</span></p>
          <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary">
            Created: {new Date(leftNotice.createdAt).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border p-4">
          <h3 className="text-xs font-semibold uppercase text-ink-secondary dark:text-dark-text-secondary mb-2">
            Version {rightNotice.version}
          </h3>
          <p className="text-sm text-ink dark:text-dark-text">Status: <span className="font-medium">{rightNotice.status}</span></p>
          <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary">
            Created: {new Date(rightNotice.createdAt).toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  );
}
