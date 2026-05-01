import { useState, useEffect } from 'react';
import { useNoticeFieldsStore } from '@/store/noticeFieldsStore';
import { useAutoSave } from '../hooks/useAutoSave';
import DateChainBadge from '../components/DateChainBadge';

const STEPS = ['13(2) Reference', 'Possession Details', 'Witnesses', 'Newspaper Publication', 'DRT & Review'];

export default function PossessionNoticeForm({ onSubmit }: { onSubmit: () => void }) {
  const { noticeFields, setFieldFromForm, caseData } = useNoticeFieldsStore();
  const [step, setStep] = useState(0);
  const saveStatus = useAutoSave();

  const inputCls = 'w-full px-4 py-2.5 rounded-xl bg-white dark:bg-dark-surface-hover border border-sand-300 dark:border-dark-border text-ink dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-accent/30';
  const readOnlyCls = `${inputCls} bg-sand-100 dark:bg-dark-surface cursor-not-allowed`;
  const labelCls = 'block text-sm font-medium text-ink-secondary dark:text-dark-text-secondary mb-1';
  const selectCls = 'w-full px-4 py-2.5 rounded-xl bg-white dark:bg-dark-surface-hover border border-sand-300 dark:border-dark-border text-ink dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-accent/30';

  const getVal = (key: string) => (noticeFields[key] ?? '') as string;
  const getNum = (key: string) => Number(noticeFields[key] ?? 0);
  const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFieldFromForm(key, e.target.value);
  };
  const handleNumChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldFromForm(key, parseFloat(e.target.value) || 0);
  };

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amt);

  // Auto-compute Section 17 deadline (possession date + 45 days)
  useEffect(() => {
    const possDate = getVal('dateOfPossession');
    if (possDate) {
      const d = new Date(possDate);
      d.setDate(d.getDate() + 45);
      setFieldFromForm('section17Deadline', d.toISOString().split('T')[0]);
    }
  }, [noticeFields.dateOfPossession]);

  const borrowers = (caseData?.borrowers as Array<{ name: string; address: string; type: string }>) || [];
  const assets = (caseData?.securedAssets as Array<{ assetType: string; description: string; district?: string; state?: string }>) || [];

  const saveIndicator = () => {
    if (saveStatus === 'saving') return <span className="text-xs text-ink-tertiary animate-pulse">Saving...</span>;
    if (saveStatus === 'saved') return <span className="text-xs text-green-600">Saved ✓</span>;
    if (saveStatus === 'error') return <span className="text-xs text-red-500">Save failed</span>;
    return null;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Step indicator + save status */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-sand-300 dark:border-dark-border">
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {STEPS.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-colors ${
                i === step ? 'bg-accent text-white' : i < step ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-sand-200 dark:bg-dark-surface text-ink-tertiary dark:text-dark-text-tertiary'
              }`}
            >
              {i < step ? '✓' : ''} {label}
            </button>
          ))}
        </div>
        {saveIndicator()}
      </div>

      {/* Form content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Step 0: 13(2) Reference (auto-filled, read-only) */}
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-ink dark:text-dark-text">Prior Demand Notice Reference</h3>
            <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary">
              Auto-filled from the most recent finalized Section 13(2) Demand Notice for this case. These fields are read-only.
            </p>

            <DateChainBadge
              demandNoticeDate={getVal('refDemandNoticeDate')}
              possessionDate={getVal('dateOfPossession')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>13(2) Notice Date</label>
                <input
                  type="date"
                  value={getVal('refDemandNoticeDate') ? new Date(getVal('refDemandNoticeDate')).toISOString().split('T')[0] : ''}
                  readOnly
                  className={readOnlyCls}
                />
                <span className="text-xs text-accent mt-1 inline-block">🔗 Auto-linked from finalized 13(2) notice</span>
              </div>
              <div>
                <label className={labelCls}>13(2) Amount Demanded</label>
                <div className={`${readOnlyCls} flex items-center`}>
                  <span className="font-semibold text-ink dark:text-dark-text">
                    {getNum('refDemandAmountDemanded') > 0 ? formatCurrency(getNum('refDemandAmountDemanded')) : '—'}
                  </span>
                  <span className="text-xs text-accent ml-2">🔗 Auto-linked</span>
                </div>
              </div>
            </div>

            {/* Borrowers from case (display) */}
            <div className="space-y-3 mt-4">
              <h4 className="text-sm font-medium text-ink-secondary dark:text-dark-text-secondary">Borrowers (from case)</h4>
              {borrowers.map((b, i) => (
                <div key={i} className="bg-sand-100 dark:bg-dark-surface-hover rounded-xl border border-sand-300 dark:border-dark-border p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      b.type === 'primary' ? 'bg-accent-light text-accent' :
                      b.type === 'co-borrower' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{b.type}</span>
                    <span className="font-medium text-ink dark:text-dark-text text-sm">{b.name}</span>
                  </div>
                  <p className="text-sm text-ink-secondary dark:text-dark-text-secondary">{b.address}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Possession Details */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-ink dark:text-dark-text">Possession Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Outstanding Amount on Possession Date (₹) *</label>
                <input
                  type="number"
                  data-field-key="outstandingOnPossessionDate"
                  value={getNum('outstandingOnPossessionDate') || ''}
                  onChange={handleNumChange('outstandingOnPossessionDate')}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelCls}>Date of Possession *</label>
                <input
                  type="date"
                  data-field-key="dateOfPossession"
                  value={getVal('dateOfPossession') ? new Date(getVal('dateOfPossession')).toISOString().split('T')[0] : ''}
                  onChange={handleChange('dateOfPossession')}
                  className={inputCls}
                />
                {getVal('refDemandNoticeDate') && getVal('dateOfPossession') && (
                  <DateChainBadge
                    demandNoticeDate={getVal('refDemandNoticeDate')}
                    possessionDate={getVal('dateOfPossession')}
                  />
                )}
              </div>
              <div>
                <label className={labelCls}>Mode of Possession *</label>
                <select
                  data-field-key="modeOfPossession"
                  value={getVal('modeOfPossession')}
                  onChange={handleChange('modeOfPossession')}
                  className={selectCls}
                >
                  <option value="">— Select —</option>
                  <option value="symbolic">Symbolic Possession</option>
                  <option value="physical">Physical Possession</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Notice Date *</label>
                <input
                  type="date"
                  data-field-key="noticeDate"
                  value={getVal('noticeDate') ? new Date(getVal('noticeDate')).toISOString().split('T')[0] : ''}
                  onChange={handleChange('noticeDate')}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Authorized Officer Name *</label>
                <input
                  data-field-key="authorizedOfficerName"
                  value={getVal('authorizedOfficerName')}
                  onChange={handleChange('authorizedOfficerName')}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Authorized Officer Designation *</label>
                <input
                  data-field-key="authorizedOfficerDesignation"
                  value={getVal('authorizedOfficerDesignation')}
                  onChange={handleChange('authorizedOfficerDesignation')}
                  className={inputCls}
                  placeholder="e.g. Chief Manager"
                />
              </div>
              <div>
                <label className={labelCls}>Place of Notice *</label>
                <input
                  data-field-key="placeOfNotice"
                  value={getVal('placeOfNotice')}
                  onChange={handleChange('placeOfNotice')}
                  className={inputCls}
                  placeholder="e.g. Mumbai"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Witnesses */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-ink dark:text-dark-text">Witnesses</h3>
            <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary">
              At least one witness is mandatory. Two witnesses are recommended for stronger legal standing.
            </p>

            <div className="bg-sand-100 dark:bg-dark-surface-hover rounded-xl border border-sand-300 dark:border-dark-border p-5 space-y-4">
              <h4 className="text-sm font-semibold text-ink dark:text-dark-text">Witness 1 (Mandatory)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Name *</label>
                  <input
                    data-field-key="witness1Name"
                    value={getVal('witness1Name')}
                    onChange={handleChange('witness1Name')}
                    className={inputCls}
                    placeholder="Full name of witness"
                  />
                </div>
                <div>
                  <label className={labelCls}>Designation *</label>
                  <input
                    data-field-key="witness1Designation"
                    value={getVal('witness1Designation')}
                    onChange={handleChange('witness1Designation')}
                    className={inputCls}
                    placeholder="e.g. Bank Officer"
                  />
                </div>
              </div>
            </div>

            <div className="bg-sand-100 dark:bg-dark-surface-hover rounded-xl border border-sand-300 dark:border-dark-border p-5 space-y-4">
              <h4 className="text-sm font-semibold text-ink dark:text-dark-text flex items-center gap-2">
                Witness 2 (Recommended)
                {!getVal('witness2Name') && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">⚠ Recommended</span>
                )}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Name</label>
                  <input
                    data-field-key="witness2Name"
                    value={getVal('witness2Name')}
                    onChange={handleChange('witness2Name')}
                    className={inputCls}
                    placeholder="Full name of witness"
                  />
                </div>
                <div>
                  <label className={labelCls}>Designation</label>
                  <input
                    data-field-key="witness2Designation"
                    value={getVal('witness2Designation')}
                    onChange={handleChange('witness2Designation')}
                    className={inputCls}
                    placeholder="e.g. Bank Officer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Newspaper Publication */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-ink dark:text-dark-text">Newspaper Publication</h3>
            <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary">
              Publication must be in one English and one vernacular (regional language) newspaper. Both must be published within 7 days of the possession date.
            </p>

            <div className="bg-sand-100 dark:bg-dark-surface-hover rounded-xl border border-sand-300 dark:border-dark-border p-5 space-y-4">
              <h4 className="text-sm font-semibold text-ink dark:text-dark-text">English Newspaper</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Newspaper Name *</label>
                  <input
                    data-field-key="newspaper1Name"
                    value={getVal('newspaper1Name')}
                    onChange={handleChange('newspaper1Name')}
                    className={inputCls}
                    placeholder="e.g. The Times of India"
                  />
                </div>
                <div>
                  <label className={labelCls}>Publication Date *</label>
                  <input
                    type="date"
                    data-field-key="newspaper1Date"
                    value={getVal('newspaper1Date') ? new Date(getVal('newspaper1Date')).toISOString().split('T')[0] : ''}
                    onChange={handleChange('newspaper1Date')}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            <div className="bg-sand-100 dark:bg-dark-surface-hover rounded-xl border border-sand-300 dark:border-dark-border p-5 space-y-4">
              <h4 className="text-sm font-semibold text-ink dark:text-dark-text">Vernacular Newspaper</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Newspaper Name *</label>
                  <input
                    data-field-key="newspaper2Name"
                    value={getVal('newspaper2Name')}
                    onChange={handleChange('newspaper2Name')}
                    className={inputCls}
                    placeholder="e.g. Maharashtra Times"
                  />
                </div>
                <div>
                  <label className={labelCls}>Publication Date *</label>
                  <input
                    type="date"
                    data-field-key="newspaper2Date"
                    value={getVal('newspaper2Date') ? new Date(getVal('newspaper2Date')).toISOString().split('T')[0] : ''}
                    onChange={handleChange('newspaper2Date')}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: DRT & Review */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-ink dark:text-dark-text">DRT & Review</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>DRT Name & Location *</label>
                <input
                  data-field-key="drtNameLocation"
                  value={getVal('drtNameLocation')}
                  onChange={handleChange('drtNameLocation')}
                  className={inputCls}
                  placeholder="e.g. DRT Mumbai"
                />
              </div>
              <div>
                <label className={labelCls}>Section 17 Deadline (45 days from possession)</label>
                <input
                  type="date"
                  value={getVal('section17Deadline')}
                  readOnly
                  className={readOnlyCls}
                />
                <span className="text-xs text-accent mt-1 inline-block">⚡ Auto-computed: Possession date + 45 days</span>
              </div>
            </div>

            {/* Full summary */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-ink dark:text-dark-text mb-3">Summary</h4>
              <div className="bg-sand-100 dark:bg-dark-surface-hover rounded-xl border border-sand-300 dark:border-dark-border p-5 space-y-3 text-sm">
                {/* Date chain */}
                <DateChainBadge
                  demandNoticeDate={getVal('refDemandNoticeDate')}
                  possessionDate={getVal('dateOfPossession')}
                />

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Notice Date:</span> <span className="text-ink dark:text-dark-text font-medium">{getVal('noticeDate') ? new Date(getVal('noticeDate')).toLocaleDateString('en-IN') : '—'}</span></div>
                  <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Place:</span> <span className="text-ink dark:text-dark-text font-medium">{getVal('placeOfNotice') || '—'}</span></div>
                  <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">13(2) Ref Date:</span> <span className="text-ink dark:text-dark-text font-medium">{getVal('refDemandNoticeDate') ? new Date(getVal('refDemandNoticeDate')).toLocaleDateString('en-IN') : '—'}</span></div>
                  <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">13(2) Amount:</span> <span className="text-ink dark:text-dark-text font-medium">{getNum('refDemandAmountDemanded') > 0 ? formatCurrency(getNum('refDemandAmountDemanded')) : '—'}</span></div>
                  <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Outstanding:</span> <span className="text-ink dark:text-dark-text font-bold">{formatCurrency(getNum('outstandingOnPossessionDate'))}</span></div>
                  <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Possession Date:</span> <span className="text-ink dark:text-dark-text font-medium">{getVal('dateOfPossession') ? new Date(getVal('dateOfPossession')).toLocaleDateString('en-IN') : '—'}</span></div>
                  <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Mode:</span> <span className="text-ink dark:text-dark-text font-medium capitalize">{getVal('modeOfPossession') || '—'}</span></div>
                  <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">AO Name:</span> <span className="text-ink dark:text-dark-text font-medium">{getVal('authorizedOfficerName') || '—'}</span></div>
                  <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Witness 1:</span> <span className="text-ink dark:text-dark-text font-medium">{getVal('witness1Name') || '—'}</span></div>
                  <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Witness 2:</span> <span className="text-ink dark:text-dark-text font-medium">{getVal('witness2Name') || '—'}</span></div>
                  <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Eng. Paper:</span> <span className="text-ink dark:text-dark-text font-medium">{getVal('newspaper1Name') || '—'}</span></div>
                  <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Vern. Paper:</span> <span className="text-ink dark:text-dark-text font-medium">{getVal('newspaper2Name') || '—'}</span></div>
                  <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">DRT:</span> <span className="text-ink dark:text-dark-text font-medium">{getVal('drtNameLocation') || '—'}</span></div>
                  <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Sec.17 Deadline:</span> <span className="text-ink dark:text-dark-text font-medium">{getVal('section17Deadline') ? new Date(getVal('section17Deadline')).toLocaleDateString('en-IN') : '—'}</span></div>
                </div>

                <div className="border-t border-sand-300 dark:border-dark-border pt-3">
                  <p className="text-ink-tertiary dark:text-dark-text-tertiary mb-1">Recipients ({borrowers.length}):</p>
                  {borrowers.map((b, i) => (
                    <div key={i} className="ml-2">{b.name} ({b.type})</div>
                  ))}
                </div>

                <div className="border-t border-sand-300 dark:border-dark-border pt-3">
                  <p className="text-ink-tertiary dark:text-dark-text-tertiary mb-1">Secured Assets ({assets.length}):</p>
                  {assets.map((a, i) => (
                    <div key={i} className="ml-2">{a.assetType}: {a.description}</div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onSubmit}
              className="w-full py-3 rounded-xl text-sm font-medium bg-accent text-white hover:bg-accent-hover transition-colors"
            >
              Submit for Review
            </button>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      {step < 4 && (
        <div className="shrink-0 flex justify-between px-6 py-4 border-t border-sand-300 dark:border-dark-border">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-sand-200 dark:bg-dark-surface text-ink dark:text-dark-text hover:bg-sand-300 dark:hover:bg-dark-surface-hover transition-colors disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(4, s + 1))}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-accent text-white hover:bg-accent-hover transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
