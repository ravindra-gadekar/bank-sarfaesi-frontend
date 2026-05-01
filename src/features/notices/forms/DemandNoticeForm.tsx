import { useState, useEffect } from 'react';
import { useNoticeFieldsStore } from '@/store/noticeFieldsStore';
import { useAutoSave } from '../hooks/useAutoSave';

const STEPS = ['Notice Details', 'Amounts', 'Borrower Info', 'Assets & Security', 'Review & Submit'];

export default function DemandNoticeForm({ onSubmit }: { onSubmit: () => void }) {
  const { noticeFields, setField, caseData } = useNoticeFieldsStore();
  const [step, setStep] = useState(0);
  const saveStatus = useAutoSave();

  const inputCls = 'w-full px-4 py-2.5 rounded-xl bg-white dark:bg-dark-surface-hover border border-sand-300 dark:border-dark-border text-ink dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-accent/30';
  const labelCls = 'block text-sm font-medium text-ink-secondary dark:text-dark-text-secondary mb-1';

  const getVal = (key: string) => (noticeFields[key] ?? '') as string;
  const getNum = (key: string) => Number(noticeFields[key] ?? 0);
  const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setField(key, e.target.value);
  };
  const handleNumChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setField(key, parseFloat(e.target.value) || 0);
  };

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amt);

  const totalComputed = getNum('outstandingPrincipal') + getNum('outstandingInterest') + getNum('otherCharges');

  // Sync computed total into the store so it's persisted/validated on submit
  useEffect(() => {
    setField('totalAmountDemanded', totalComputed);
  }, [totalComputed]);

  // Compute repayment deadline
  useEffect(() => {
    const nd = getVal('noticeDate');
    if (nd) {
      const d = new Date(nd);
      d.setDate(d.getDate() + 60);
      setField('repaymentDeadline', d.toISOString().split('T')[0]);
    }
  }, [noticeFields.noticeDate]);

  const borrowers = (caseData?.borrowers as Array<{ name: string; address: string; type: string }>) || [];
  const assets = (caseData?.securedAssets as Array<{ assetType: string; description: string; district?: string; state?: string }>) || [];
  const secDocs = (caseData?.securityDocuments as Array<{ documentType: string; date: string }>) || [];

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
        {/* Step 0: Notice Details */}
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-ink dark:text-dark-text">Notice Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Notice Date *</label>
                <input type="date" data-field-key="noticeDate" value={getVal('noticeDate')} onChange={handleChange('noticeDate')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Place of Notice *</label>
                <input data-field-key="placeOfNotice" value={getVal('placeOfNotice')} onChange={handleChange('placeOfNotice')} className={inputCls} placeholder="e.g. Mumbai" />
              </div>
              <div>
                <label className={labelCls}>Authorized Officer Name *</label>
                <input data-field-key="authorizedOfficerName" value={getVal('authorizedOfficerName')} onChange={handleChange('authorizedOfficerName')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Authorized Officer Designation *</label>
                <input data-field-key="authorizedOfficerDesignation" value={getVal('authorizedOfficerDesignation')} onChange={handleChange('authorizedOfficerDesignation')} className={inputCls} placeholder="e.g. Chief Manager" />
              </div>
              <div>
                <label className={labelCls}>Repayment Deadline (60 days)</label>
                <input type="date" value={getVal('repaymentDeadline')} readOnly className={`${inputCls} bg-sand-100 dark:bg-dark-surface cursor-not-allowed`} />
                <span className="text-xs text-accent mt-1 inline-block">⚡ Auto-computed from notice date + 60 days</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Amounts */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-ink dark:text-dark-text">Outstanding Amounts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Outstanding Principal (₹) *</label>
                <input type="number" data-field-key="outstandingPrincipal" value={getNum('outstandingPrincipal') || ''} onChange={handleNumChange('outstandingPrincipal')} className={inputCls} placeholder="0" />
              </div>
              <div>
                <label className={labelCls}>Outstanding Interest (₹) *</label>
                <input type="number" data-field-key="outstandingInterest" value={getNum('outstandingInterest') || ''} onChange={handleNumChange('outstandingInterest')} className={inputCls} placeholder="0" />
              </div>
              <div>
                <label className={labelCls}>Other Charges (₹)</label>
                <input type="number" data-field-key="otherCharges" value={getNum('otherCharges') || ''} onChange={handleNumChange('otherCharges')} className={inputCls} placeholder="0" />
              </div>
              <div>
                <label className={labelCls}>Total Amount Demanded</label>
                <div className={`${inputCls} bg-sand-100 dark:bg-dark-surface flex items-center gap-2`}>
                  <span className="font-semibold text-ink dark:text-dark-text">{formatCurrency(totalComputed)}</span>
                  <span className="text-xs text-accent">⚡ Auto-computed</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Borrower Info */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-ink dark:text-dark-text">Borrower Information</h3>
            <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary">Pre-filled from the linked NPA case. Edit the case to update these.</p>
            <div className="space-y-3">
              {borrowers.map((b, i) => (
                <div key={i} className="bg-sand-100 dark:bg-dark-surface-hover rounded-xl border border-sand-300 dark:border-dark-border p-4">
                  <div className="flex items-center gap-2 mb-2">
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
              {borrowers.length === 0 && (
                <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary">No borrowers found in the case.</p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Assets & Security */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-ink dark:text-dark-text">Secured Assets</h3>
              <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary">Pre-filled from the linked NPA case.</p>
              {assets.map((a, i) => (
                <div key={i} className="bg-sand-100 dark:bg-dark-surface-hover rounded-xl border border-sand-300 dark:border-dark-border p-4 text-sm">
                  <span className="font-medium text-ink dark:text-dark-text">{a.assetType}</span>
                  <p className="text-ink-secondary dark:text-dark-text-secondary">{a.description}</p>
                  {a.district && <p className="text-ink-tertiary dark:text-dark-text-tertiary">District: {a.district}, {a.state}</p>}
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-ink dark:text-dark-text">Security Documents</h3>
              {secDocs.length > 0 ? secDocs.map((d, i) => (
                <div key={i} className="bg-sand-100 dark:bg-dark-surface-hover rounded-xl border border-sand-300 dark:border-dark-border p-4 text-sm">
                  <span className="font-medium text-ink dark:text-dark-text">{d.documentType}</span>
                  <span className="text-ink-tertiary dark:text-dark-text-tertiary ml-2">{d.date}</span>
                </div>
              )) : (
                <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary">No security documents.</p>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-ink dark:text-dark-text">Review & Submit</h3>
            <div className="bg-sand-100 dark:bg-dark-surface-hover rounded-xl border border-sand-300 dark:border-dark-border p-5 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Notice Date:</span> <span className="text-ink dark:text-dark-text font-medium">{getVal('noticeDate')}</span></div>
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Place:</span> <span className="text-ink dark:text-dark-text font-medium">{getVal('placeOfNotice')}</span></div>
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">AO Name:</span> <span className="text-ink dark:text-dark-text font-medium">{getVal('authorizedOfficerName')}</span></div>
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">AO Designation:</span> <span className="text-ink dark:text-dark-text font-medium">{getVal('authorizedOfficerDesignation')}</span></div>
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Principal:</span> <span className="text-ink dark:text-dark-text font-medium">{formatCurrency(getNum('outstandingPrincipal'))}</span></div>
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Interest:</span> <span className="text-ink dark:text-dark-text font-medium">{formatCurrency(getNum('outstandingInterest'))}</span></div>
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Other Charges:</span> <span className="text-ink dark:text-dark-text font-medium">{formatCurrency(getNum('otherCharges'))}</span></div>
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Total:</span> <span className="text-ink dark:text-dark-text font-bold">{formatCurrency(totalComputed)}</span></div>
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Deadline:</span> <span className="text-ink dark:text-dark-text font-medium">{getVal('repaymentDeadline')}</span></div>
              </div>

              <div className="border-t border-sand-300 dark:border-dark-border pt-3">
                <p className="text-ink-tertiary dark:text-dark-text-tertiary mb-1">Recipients ({borrowers.length}):</p>
                {borrowers.map((b, i) => (
                  <div key={i} className="ml-2">{b.name} ({b.type})</div>
                ))}
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
