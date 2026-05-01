import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { caseApi, CreateCasePayload, Borrower, SecuredAsset, SecurityDocument } from './api/caseApi';
import { INDIAN_STATES } from '@/lib/constants';

const LOAN_TYPES = [
  'Term Loan', 'Cash Credit', 'Overdraft', 'Housing', 'Vehicle',
  'Education', 'Personal', 'Agricultural', 'MSME', 'Other',
] as const;

const STEPS = ['Loan Info', 'Primary Borrower', 'Co-Borrowers', 'Guarantors', 'Secured Assets', 'Security Docs', 'Review'];

interface FormData {
  accountNo: string;
  loanType: string;
  sanctionDate: string;
  sanctionAmount: number;
  npaDate: string;
  borrowers: Borrower[];
  securedAssets: SecuredAsset[];
  securityDocuments: SecurityDocument[];
}

const emptyBorrower = (type: Borrower['type']): Borrower => ({ name: '', address: '', pan: '', type });
const emptyAsset = (): SecuredAsset => ({ assetType: '', description: '', surveyNo: '', area: '', district: '', state: '' });
const emptyDoc = (): SecurityDocument => ({ documentType: '', date: '' });

export default function CaseFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, control, watch, formState: { errors }, trigger } = useForm<FormData>({
    defaultValues: {
      accountNo: '', loanType: 'Term Loan', sanctionDate: '', sanctionAmount: 0, npaDate: '',
      borrowers: [emptyBorrower('primary')],
      securedAssets: [emptyAsset()],
      securityDocuments: [],
    },
  });

  const { fields: borrowerFields, append: addBorrower, remove: removeBorrower } = useFieldArray({ control, name: 'borrowers' });
  const { fields: assetFields, append: addAsset, remove: removeAsset } = useFieldArray({ control, name: 'securedAssets' });
  const { fields: docFields, append: addDoc, remove: removeDoc } = useFieldArray({ control, name: 'securityDocuments' });

  const watchAll = watch();

  const inputCls = 'w-full px-4 py-2.5 rounded-xl bg-white dark:bg-dark-surface border border-sand-300 dark:border-dark-border text-ink dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-accent/30';
  const labelCls = 'block text-sm font-medium text-ink-secondary dark:text-dark-text-secondary mb-1';
  const errCls = 'text-red-500 text-xs mt-1';

  const validateStep = async (): Promise<boolean> => {
    switch (step) {
      case 0: return trigger(['accountNo', 'loanType', 'sanctionDate', 'sanctionAmount', 'npaDate']);
      case 1: return trigger(['borrowers.0.name', 'borrowers.0.address']);
      default: return true;
    }
  };

  const nextStep = async () => {
    const valid = await validateStep();
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError('');
    try {
      const payload: CreateCasePayload = {
        ...data,
        sanctionAmount: Number(data.sanctionAmount),
      };
      if (isEdit) {
        await caseApi.update(id!, payload);
      } else {
        await caseApi.create(payload);
      }
      navigate('/cases');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; details?: Array<{ message: string }> } } };
      setError(err.response?.data?.details?.[0]?.message || err.response?.data?.message || 'Failed to save case');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-ink dark:text-dark-text mb-6 tracking-tight">
        {isEdit ? 'Edit Case' : 'Create NPA Case'}
      </h2>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i === step
                  ? 'bg-accent text-white'
                  : i < step
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-pointer'
                    : 'bg-sand-200 dark:bg-dark-surface text-ink-tertiary dark:text-dark-text-tertiary'
              }`}
            >
              {i < step ? '✓' : i + 1} {label}
            </button>
            {i < STEPS.length - 1 && <div className="w-4 h-px bg-sand-300 dark:bg-dark-border" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border p-6">
          {/* Step 0: Loan Info */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-ink dark:text-dark-text">Loan Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Account Number *</label>
                  <input {...register('accountNo', { required: 'Account number is required' })} className={inputCls} placeholder="e.g. 1234567890" />
                  {errors.accountNo && <p className={errCls}>{errors.accountNo.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Loan Type *</label>
                  <select {...register('loanType', { required: 'Loan type is required' })} className={inputCls}>
                    {LOAN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Sanction Date *</label>
                  <input type="date" {...register('sanctionDate', { required: 'Sanction date is required' })} className={inputCls} />
                  {errors.sanctionDate && <p className={errCls}>{errors.sanctionDate.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Sanction Amount (₹) *</label>
                  <input type="number" {...register('sanctionAmount', { required: 'Amount is required', min: { value: 100000, message: 'Minimum ₹1,00,000 (SARFAESI threshold)' } })} className={inputCls} placeholder="Min ₹1,00,000" />
                  {errors.sanctionAmount && <p className={errCls}>{errors.sanctionAmount.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>NPA Classification Date *</label>
                  <input type="date" {...register('npaDate', { required: 'NPA date is required' })} className={inputCls} />
                  {errors.npaDate && <p className={errCls}>{errors.npaDate.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Primary Borrower */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-ink dark:text-dark-text">Primary Borrower</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={labelCls}>Name *</label>
                  <input {...register('borrowers.0.name', { required: 'Borrower name is required' })} className={inputCls} />
                  {errors.borrowers?.[0]?.name && <p className={errCls}>{errors.borrowers[0].name.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Address *</label>
                  <textarea {...register('borrowers.0.address', { required: 'Address is required' })} className={inputCls} rows={2} />
                  {errors.borrowers?.[0]?.address && <p className={errCls}>{errors.borrowers[0].address.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>PAN (optional)</label>
                  <input {...register('borrowers.0.pan')} className={inputCls} placeholder="ABCDE1234F" />
                </div>
                <input type="hidden" {...register('borrowers.0.type')} value="primary" />
              </div>
            </div>
          )}

          {/* Step 2: Co-Borrowers */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-ink dark:text-dark-text">Co-Borrowers</h3>
              <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary">Add any co-borrowers (optional)</p>
              {borrowerFields.map((field, index) => {
                if (watchAll.borrowers?.[index]?.type !== 'co-borrower') return null;
                return (
                  <div key={field.id} className="relative bg-sand-100 dark:bg-dark-surface-hover rounded-xl p-4 border border-sand-300 dark:border-dark-border">
                    <button type="button" onClick={() => removeBorrower(index)} className="absolute top-2 right-2 text-red-500 text-xs font-medium">Remove</button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Name *</label>
                        <input {...register(`borrowers.${index}.name`, { required: 'Name required' })} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>PAN</label>
                        <input {...register(`borrowers.${index}.pan`)} className={inputCls} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelCls}>Address *</label>
                        <textarea {...register(`borrowers.${index}.address`, { required: 'Address required' })} className={inputCls} rows={2} />
                      </div>
                    </div>
                    <input type="hidden" {...register(`borrowers.${index}.type`)} value="co-borrower" />
                  </div>
                );
              })}
              <button type="button" onClick={() => addBorrower(emptyBorrower('co-borrower'))} className="text-accent hover:text-accent-hover text-sm font-medium">+ Add Co-Borrower</button>
            </div>
          )}

          {/* Step 3: Guarantors */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-ink dark:text-dark-text">Guarantors</h3>
              <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary">Add any guarantors (optional)</p>
              {borrowerFields.map((field, index) => {
                if (watchAll.borrowers?.[index]?.type !== 'guarantor') return null;
                return (
                  <div key={field.id} className="relative bg-sand-100 dark:bg-dark-surface-hover rounded-xl p-4 border border-sand-300 dark:border-dark-border">
                    <button type="button" onClick={() => removeBorrower(index)} className="absolute top-2 right-2 text-red-500 text-xs font-medium">Remove</button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Name *</label>
                        <input {...register(`borrowers.${index}.name`, { required: 'Name required' })} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>PAN</label>
                        <input {...register(`borrowers.${index}.pan`)} className={inputCls} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelCls}>Address *</label>
                        <textarea {...register(`borrowers.${index}.address`, { required: 'Address required' })} className={inputCls} rows={2} />
                      </div>
                    </div>
                    <input type="hidden" {...register(`borrowers.${index}.type`)} value="guarantor" />
                  </div>
                );
              })}
              <button type="button" onClick={() => addBorrower(emptyBorrower('guarantor'))} className="text-accent hover:text-accent-hover text-sm font-medium">+ Add Guarantor</button>
            </div>
          )}

          {/* Step 4: Secured Assets */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-ink dark:text-dark-text">Secured Assets</h3>
              {assetFields.map((field, index) => (
                <div key={field.id} className="relative bg-sand-100 dark:bg-dark-surface-hover rounded-xl p-4 border border-sand-300 dark:border-dark-border">
                  {assetFields.length > 1 && (
                    <button type="button" onClick={() => removeAsset(index)} className="absolute top-2 right-2 text-red-500 text-xs font-medium">Remove</button>
                  )}
                  <span className="absolute -top-2.5 left-3 bg-sand-100 dark:bg-dark-surface-hover px-2 text-xs text-ink-tertiary dark:text-dark-text-tertiary">Asset #{index + 1}</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Asset Type *</label>
                      <input {...register(`securedAssets.${index}.assetType`, { required: 'Required' })} className={inputCls} placeholder="e.g. Immovable Property" />
                    </div>
                    <div>
                      <label className={labelCls}>Survey No</label>
                      <input {...register(`securedAssets.${index}.surveyNo`)} className={inputCls} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Description *</label>
                      <textarea {...register(`securedAssets.${index}.description`, { required: 'Required' })} className={inputCls} rows={2} />
                    </div>
                    <div>
                      <label className={labelCls}>Area</label>
                      <input {...register(`securedAssets.${index}.area`)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>District</label>
                      <input {...register(`securedAssets.${index}.district`)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>State</label>
                      <select {...register(`securedAssets.${index}.state`)} className={inputCls}>
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addAsset(emptyAsset())} className="text-accent hover:text-accent-hover text-sm font-medium">+ Add Asset</button>
            </div>
          )}

          {/* Step 5: Security Documents */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-ink dark:text-dark-text">Security Documents</h3>
              <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary">Security documents executed (optional)</p>
              {docFields.map((field, index) => (
                <div key={field.id} className="relative bg-sand-100 dark:bg-dark-surface-hover rounded-xl p-4 border border-sand-300 dark:border-dark-border">
                  <button type="button" onClick={() => removeDoc(index)} className="absolute top-2 right-2 text-red-500 text-xs font-medium">Remove</button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Document Type *</label>
                      <input {...register(`securityDocuments.${index}.documentType`, { required: 'Required' })} className={inputCls} placeholder="e.g. Mortgage Deed" />
                    </div>
                    <div>
                      <label className={labelCls}>Date *</label>
                      <input type="date" {...register(`securityDocuments.${index}.date`, { required: 'Required' })} className={inputCls} />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addDoc(emptyDoc())} className="text-accent hover:text-accent-hover text-sm font-medium">+ Add Document</button>
            </div>
          )}

          {/* Step 6: Review */}
          {step === 6 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-ink dark:text-dark-text">Review & Submit</h3>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Account No:</span> <span className="text-ink dark:text-dark-text font-medium ml-2">{watchAll.accountNo}</span></div>
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Loan Type:</span> <span className="text-ink dark:text-dark-text font-medium ml-2">{watchAll.loanType}</span></div>
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Sanction Date:</span> <span className="text-ink dark:text-dark-text font-medium ml-2">{watchAll.sanctionDate}</span></div>
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Sanction Amount:</span> <span className="text-ink dark:text-dark-text font-medium ml-2">{formatCurrency(Number(watchAll.sanctionAmount))}</span></div>
                <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">NPA Date:</span> <span className="text-ink dark:text-dark-text font-medium ml-2">{watchAll.npaDate}</span></div>
              </div>

              <div>
                <h4 className="font-medium text-ink dark:text-dark-text mb-2">Borrowers ({watchAll.borrowers?.length || 0})</h4>
                <div className="space-y-2">
                  {watchAll.borrowers?.map((b, i) => (
                    <div key={i} className="text-sm bg-sand-100 dark:bg-dark-surface-hover rounded-lg p-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-sand-200 dark:bg-dark-border text-ink-secondary dark:text-dark-text-secondary mr-2">{b.type}</span>
                      <span className="text-ink dark:text-dark-text font-medium">{b.name}</span>
                      {b.pan && <span className="text-ink-tertiary dark:text-dark-text-tertiary ml-2">PAN: {b.pan}</span>}
                      <p className="text-ink-secondary dark:text-dark-text-secondary mt-1">{b.address}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-ink dark:text-dark-text mb-2">Secured Assets ({watchAll.securedAssets?.length || 0})</h4>
                <div className="space-y-2">
                  {watchAll.securedAssets?.map((a, i) => (
                    <div key={i} className="text-sm bg-sand-100 dark:bg-dark-surface-hover rounded-lg p-3">
                      <span className="text-ink dark:text-dark-text font-medium">{a.assetType}</span>
                      <p className="text-ink-secondary dark:text-dark-text-secondary">{a.description}</p>
                      {a.district && <p className="text-ink-tertiary dark:text-dark-text-tertiary">{a.district}, {a.state}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {watchAll.securityDocuments && watchAll.securityDocuments.length > 0 && (
                <div>
                  <h4 className="font-medium text-ink dark:text-dark-text mb-2">Security Documents ({watchAll.securityDocuments.length})</h4>
                  {watchAll.securityDocuments.map((d, i) => (
                    <div key={i} className="text-sm bg-sand-100 dark:bg-dark-surface-hover rounded-lg p-3 mb-2">
                      {d.documentType} — {d.date}
                    </div>
                  ))}
                </div>
              )}

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={step === 0 ? () => navigate('/cases') : prevStep}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-sand-200 dark:bg-dark-surface text-ink dark:text-dark-text hover:bg-sand-300 dark:hover:bg-dark-surface-hover transition-colors"
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-accent text-white hover:bg-accent-hover transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEdit ? 'Update Case' : 'Create Case'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
