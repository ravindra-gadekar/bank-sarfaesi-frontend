import { useState, useEffect } from 'react';
import { useNoticeFieldsStore } from '@/store/noticeFieldsStore';
import { useAutoSave } from '../hooks/useAutoSave';
import NoticeDateChain from '../components/NoticeDateChain';
import MultiDatePicker from '../components/MultiDatePicker';

const STEPS = [
  'Prior Notice Ref',
  'Auction Details',
  'Valuation Reports',
  'EMD & Inspection',
  'Terms & Legal',
  'Review & Submit',
];

const EMD_MODES = ['DD', 'RTGS', 'NEFT', 'Online Banking', 'UPI'];

export default function SaleAuctionNoticeForm({ onSubmit }: { onSubmit: () => void }) {
  const { noticeFields, setFieldFromForm, caseData } = useNoticeFieldsStore();
  const [step, setStep] = useState(0);
  const saveStatus = useAutoSave();

  const inputCls = 'w-full px-4 py-2.5 rounded-xl bg-white dark:bg-dark-surface-hover border border-sand-300 dark:border-dark-border text-ink dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-accent/30';
  const readOnlyCls = `${inputCls} bg-sand-100 dark:bg-dark-surface cursor-not-allowed`;
  const labelCls = 'block text-sm font-medium text-ink-secondary dark:text-dark-text-secondary mb-1';
  const selectCls = inputCls;

  const getVal = (key: string) => (noticeFields[key] ?? '') as string;
  const getNum = (key: string) => Number(noticeFields[key] ?? 0);
  const getArr = (key: string) => (noticeFields[key] as string[] ?? []);
  const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFieldFromForm(key, e.target.value);
  };
  const handleNumChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldFromForm(key, parseFloat(e.target.value) || 0);
  };

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amt);

  // Auto-compute minimum auction date (notice date + 30 days)
  useEffect(() => {
    const nd = getVal('noticeDate');
    if (nd) {
      const d = new Date(nd);
      d.setDate(d.getDate() + 30);
      setFieldFromForm('minimumAuctionDate', d.toISOString().split('T')[0]);
    }
  }, [noticeFields.noticeDate]);

  // Auto-compute EMD percentage
  const emdPercentage =
    getNum('reservePrice') > 0
      ? Math.round((getNum('emdAmount') / getNum('reservePrice')) * 10000) / 100
      : 0;

  // Toggle EMD payment mode
  const toggleEmdMode = (mode: string) => {
    const current = getArr('emdPaymentModes');
    const updated = current.includes(mode)
      ? current.filter((m) => m !== mode)
      : [...current, mode];
    setFieldFromForm('emdPaymentModes', updated);
  };

  const borrowers = (caseData?.borrowers as Array<{ name: string; address: string; type: string }>) || [];
  const assets = (caseData?.securedAssets as Array<{ assetType: string; description: string; district?: string; state?: string }>) || [];

  // Get prior dates for chain visualization
  // These come from the prefill service via the store (auto-linked)
  const refPossessionDate = getVal('refPossessionDate');

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
        {/* Step 0: Prior Notice Reference */}
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-ink dark:text-dark-text">Prior Possession Notice Reference</h3>
            <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary">
              Auto-filled from the most recent finalized Section 13(4) Possession Notice for this case.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>13(4) Possession Date</label>
                <input
                  type="date"
                  value={refPossessionDate ? new Date(refPossessionDate).toISOString().split('T')[0] : ''}
                  readOnly
                  className={readOnlyCls}
                />
                <span className="text-xs text-accent mt-1 inline-block">🔗 Auto-linked from finalized 13(4) notice</span>
              </div>
              <div>
                <label className={labelCls}>Outstanding Amount on Sale Notice Date (₹) *</label>
                <input
                  type="number"
                  data-field-key="outstandingOnSaleNoticeDate"
                  value={getNum('outstandingOnSaleNoticeDate') || ''}
                  onChange={handleNumChange('outstandingOnSaleNoticeDate')}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Sale Notice Date *</label>
                <input
                  type="date"
                  data-field-key="noticeDate"
                  value={getVal('noticeDate') ? new Date(getVal('noticeDate')).toISOString().split('T')[0] : ''}
                  onChange={handleChange('noticeDate')}
                  className={inputCls}
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
            </div>
          </div>
        )}

        {/* Step 1: Auction Details */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-ink dark:text-dark-text">Auction Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Auction Date *</label>
                <input
                  type="date"
                  data-field-key="auctionDate"
                  value={getVal('auctionDate') ? new Date(getVal('auctionDate')).toISOString().split('T')[0] : ''}
                  onChange={handleChange('auctionDate')}
                  className={inputCls}
                />
                {getVal('minimumAuctionDate') && (
                  <span className="text-xs text-accent mt-1 inline-block">
                    ⚡ Minimum: {new Date(getVal('minimumAuctionDate')).toLocaleDateString('en-IN')} (notice + 30 days)
                  </span>
                )}
              </div>
              <div>
                <label className={labelCls}>Auction Time *</label>
                <input
                  type="time"
                  data-field-key="auctionTime"
                  value={getVal('auctionTime')}
                  onChange={handleChange('auctionTime')}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Auction Venue Mode *</label>
                <select
                  data-field-key="auctionVenueMode"
                  value={getVal('auctionVenueMode')}
                  onChange={handleChange('auctionVenueMode')}
                  className={selectCls}
                >
                  <option value="">— Select —</option>
                  <option value="physical">Physical Auction</option>
                  <option value="online">Online / E-Auction</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>
                  {getVal('auctionVenueMode') === 'online' ? 'E-Auction Portal URL *' : 'Auction Venue Address *'}
                </label>
                <input
                  data-field-key="auctionVenueAddress"
                  value={getVal('auctionVenueAddress')}
                  onChange={handleChange('auctionVenueAddress')}
                  className={inputCls}
                  placeholder={getVal('auctionVenueMode') === 'online' ? 'e.g. https://ibapi.in' : 'Full address of auction venue'}
                />
              </div>
              <div>
                <label className={labelCls}>Reserve Price (₹) *</label>
                <input
                  type="number"
                  data-field-key="reservePrice"
                  value={getNum('reservePrice') || ''}
                  onChange={handleNumChange('reservePrice')}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelCls}>Bid Increment Amount (₹)</label>
                <input
                  type="number"
                  data-field-key="bidIncrementAmount"
                  value={getNum('bidIncrementAmount') || ''}
                  onChange={handleNumChange('bidIncrementAmount')}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Valuation Reports */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-ink dark:text-dark-text">Valuation Reports</h3>
            <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary">
              Two independent valuers are required as per SARFAESI rules.
            </p>

            <div className="bg-sand-100 dark:bg-dark-surface-hover rounded-xl border border-sand-300 dark:border-dark-border p-5 space-y-4">
              <h4 className="text-sm font-semibold text-ink dark:text-dark-text">Valuer 1 (Mandatory)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Valuer Name *</label>
                  <input
                    data-field-key="valuer1Name"
                    value={getVal('valuer1Name')}
                    onChange={handleChange('valuer1Name')}
                    className={inputCls}
                    placeholder="Full name of valuer"
                  />
                </div>
                <div>
                  <label className={labelCls}>Valuation Report Date *</label>
                  <input
                    type="date"
                    data-field-key="valuer1ReportDate"
                    value={getVal('valuer1ReportDate') ? new Date(getVal('valuer1ReportDate')).toISOString().split('T')[0] : ''}
                    onChange={handleChange('valuer1ReportDate')}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            <div className="bg-sand-100 dark:bg-dark-surface-hover rounded-xl border border-sand-300 dark:border-dark-border p-5 space-y-4">
              <h4 className="text-sm font-semibold text-ink dark:text-dark-text">Valuer 2 (Mandatory)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Valuer Name *</label>
                  <input
                    data-field-key="valuer2Name"
                    value={getVal('valuer2Name')}
                    onChange={handleChange('valuer2Name')}
                    className={inputCls}
                    placeholder="Full name of valuer (must be independent)"
                  />
                </div>
                <div>
                  <label className={labelCls}>Valuation Report Date *</label>
                  <input
                    type="date"
                    data-field-key="valuer2ReportDate"
                    value={getVal('valuer2ReportDate') ? new Date(getVal('valuer2ReportDate')).toISOString().split('T')[0] : ''}
                    onChange={handleChange('valuer2ReportDate')}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Same-name warning */}
            {getVal('valuer1Name') && getVal('valuer2Name') &&
              getVal('valuer1Name').toLowerCase().trim() === getVal('valuer2Name').toLowerCase().trim() && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-3 py-2 text-xs text-yellow-700 dark:text-yellow-400">
                ⚠ Both valuers have the same name. Two independent valuers are required as per SARFAESI rules.
              </div>
            )}
          </div>
        )}

        {/* Step 3: EMD & Inspection */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-ink dark:text-dark-text">EMD & Property Inspection</h3>

            <div className="bg-sand-100 dark:bg-dark-surface-hover rounded-xl border border-sand-300 dark:border-dark-border p-5 space-y-4">
              <h4 className="text-sm font-semibold text-ink dark:text-dark-text">Earnest Money Deposit (EMD)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>EMD Amount (₹) *</label>
                  <input
                    type="number"
                    data-field-key="emdAmount"
                    value={getNum('emdAmount') || ''}
                    onChange={handleNumChange('emdAmount')}
                    className={inputCls}
                    placeholder="0"
                  />
                  {emdPercentage > 0 && (
                    <span className="text-xs text-accent mt-1 inline-block">
                      ⚡ {emdPercentage}% of reserve price
                    </span>
                  )}
                </div>
                <div>
                  <label className={labelCls}>EMD Deadline *</label>
                  <input
                    type="date"
                    data-field-key="emdDeadline"
                    value={getVal('emdDeadline') ? new Date(getVal('emdDeadline')).toISOString().split('T')[0] : ''}
                    onChange={handleChange('emdDeadline')}
                    className={inputCls}
                  />
                  <span className="text-xs text-ink-tertiary dark:text-dark-text-tertiary mt-1 inline-block">Must be before auction date</span>
                </div>
              </div>

              {/* EMD Payment Modes */}
              <div>
                <label className={labelCls}>EMD Payment Modes *</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {EMD_MODES.map((mode) => {
                    const selected = getArr('emdPaymentModes').includes(mode);
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => toggleEmdMode(mode)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selected
                            ? 'bg-accent text-white'
                            : 'bg-sand-200 dark:bg-dark-surface text-ink-secondary dark:text-dark-text-secondary hover:bg-sand-300'
                        }`}
                      >
                        {selected ? '✓ ' : ''}{mode}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-sand-100 dark:bg-dark-surface-hover rounded-xl border border-sand-300 dark:border-dark-border p-5 space-y-4">
              <h4 className="text-sm font-semibold text-ink dark:text-dark-text">Property Inspection</h4>

              <MultiDatePicker
                dates={getArr('propertyInspectionDates')}
                onChange={(dates) => setFieldFromForm('propertyInspectionDates', dates)}
                minDates={2}
                label="Property Inspection Dates"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className={labelCls}>Inspection Contact Name *</label>
                  <input
                    data-field-key="inspectionContactName"
                    value={getVal('inspectionContactName')}
                    onChange={handleChange('inspectionContactName')}
                    className={inputCls}
                    placeholder="Contact person for inspection"
                  />
                </div>
                <div>
                  <label className={labelCls}>Inspection Contact Phone *</label>
                  <input
                    type="tel"
                    data-field-key="inspectionContactPhone"
                    value={getVal('inspectionContactPhone')}
                    onChange={handleChange('inspectionContactPhone')}
                    className={inputCls}
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Terms & Legal */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-ink dark:text-dark-text">Terms & Legal</h3>

            <div>
              <label className={labelCls}>Terms and Conditions *</label>
              <p className="text-xs text-ink-tertiary dark:text-dark-text-tertiary mb-2">Pre-filled with standard template. Edit as needed.</p>
              <textarea
                data-field-key="termsAndConditions"
                value={getVal('termsAndConditions')}
                onChange={handleChange('termsAndConditions')}
                rows={10}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Encumbrance Status *</label>
              <p className="text-xs text-ink-tertiary dark:text-dark-text-tertiary mb-2">Pre-filled with standard language. Edit as needed.</p>
              <textarea
                data-field-key="encumbranceStatus"
                value={getVal('encumbranceStatus')}
                onChange={handleChange('encumbranceStatus')}
                rows={4}
                className={inputCls}
              />
            </div>
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-ink dark:text-dark-text">Review & Submit</h3>

            {/* Full 3-notice date chain */}
            <NoticeDateChain
              possessionDate={refPossessionDate}
              saleNoticeDate={getVal('noticeDate')}
              auctionDate={getVal('auctionDate')}
            />

            <div className="bg-sand-100 dark:bg-dark-surface-hover rounded-xl border border-sand-300 dark:border-dark-border p-5 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Notice Date:</span> <span className="text-ink dark:text-dark-text font-medium">{getVal('noticeDate') ? new Date(getVal('noticeDate')).toLocaleDateString('en-IN') : '—'}</span></div>
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Place:</span> <span className="text-ink dark:text-dark-text font-medium">{getVal('placeOfNotice') || '—'}</span></div>
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">13(4) Possession Date:</span> <span className="text-ink dark:text-dark-text font-medium">{refPossessionDate ? new Date(refPossessionDate).toLocaleDateString('en-IN') : '—'}</span></div>
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Outstanding:</span> <span className="text-ink dark:text-dark-text font-bold">{formatCurrency(getNum('outstandingOnSaleNoticeDate'))}</span></div>
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Auction Date:</span> <span className="text-ink dark:text-dark-text font-medium">{getVal('auctionDate') ? new Date(getVal('auctionDate')).toLocaleDateString('en-IN') : '—'}</span></div>
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Auction Time:</span> <span className="text-ink dark:text-dark-text font-medium">{getVal('auctionTime') || '—'}</span></div>
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Venue Mode:</span> <span className="text-ink dark:text-dark-text font-medium capitalize">{getVal('auctionVenueMode') || '—'}</span></div>
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Reserve Price:</span> <span className="text-ink dark:text-dark-text font-bold">{formatCurrency(getNum('reservePrice'))}</span></div>
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Bid Increment:</span> <span className="text-ink dark:text-dark-text font-medium">{formatCurrency(getNum('bidIncrementAmount'))}</span></div>
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">AO Name:</span> <span className="text-ink dark:text-dark-text font-medium">{getVal('authorizedOfficerName') || '—'}</span></div>
              </div>

              <div className="border-t border-sand-300 dark:border-dark-border pt-3">
                <p className="text-ink-tertiary dark:text-dark-text-tertiary mb-1 font-medium">Valuation Reports</p>
                <div className="grid grid-cols-2 gap-2 ml-2">
                  <div>Valuer 1: {getVal('valuer1Name') || '—'}</div>
                  <div>Report: {getVal('valuer1ReportDate') ? new Date(getVal('valuer1ReportDate')).toLocaleDateString('en-IN') : '—'}</div>
                  <div>Valuer 2: {getVal('valuer2Name') || '—'}</div>
                  <div>Report: {getVal('valuer2ReportDate') ? new Date(getVal('valuer2ReportDate')).toLocaleDateString('en-IN') : '—'}</div>
                </div>
              </div>

              <div className="border-t border-sand-300 dark:border-dark-border pt-3">
                <p className="text-ink-tertiary dark:text-dark-text-tertiary mb-1 font-medium">EMD Details</p>
                <div className="grid grid-cols-2 gap-2 ml-2">
                  <div>Amount: {formatCurrency(getNum('emdAmount'))} ({emdPercentage}% of reserve)</div>
                  <div>Deadline: {getVal('emdDeadline') ? new Date(getVal('emdDeadline')).toLocaleDateString('en-IN') : '—'}</div>
                  <div className="col-span-2">Modes: {getArr('emdPaymentModes').join(', ') || '—'}</div>
                </div>
              </div>

              <div className="border-t border-sand-300 dark:border-dark-border pt-3">
                <p className="text-ink-tertiary dark:text-dark-text-tertiary mb-1 font-medium">Inspection Dates ({getArr('propertyInspectionDates').length})</p>
                <div className="ml-2">
                  {getArr('propertyInspectionDates').length > 0
                    ? getArr('propertyInspectionDates').map((d, i) => (
                        <span key={i} className="mr-2">{new Date(d).toLocaleDateString('en-IN')}</span>
                      ))
                    : '—'}
                </div>
                <div className="ml-2 mt-1">Contact: {getVal('inspectionContactName') || '—'} ({getVal('inspectionContactPhone') || '—'})</div>
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
      {step < 5 && (
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
            onClick={() => setStep((s) => Math.min(5, s + 1))}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-accent text-white hover:bg-accent-hover transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
