import { useState } from 'react';
import { useOnboardingStore } from '../../../store/onboardingStore';
import { useAuthStore } from '../../../store/authStore';
import apiClient from '../../../lib/apiClient';

export default function ReviewStep() {
  const store = useOnboardingStore();
  const email = useAuthStore((s) => s.email) ?? '';
  const { personalDetails, bankInfo, branchInfo, drtJurisdiction, letterheadFile, goToStep, nextStep, prevStep, setBranchId } = store;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/onboarding/branch', {
        branch: {
          bank: {
            name: bankInfo.bankName,
            type: bankInfo.bankType,
            rbiRegNo: bankInfo.rbiRegNo,
            hoAddress: bankInfo.hoAddress,
            state: bankInfo.state,
            website: bankInfo.website || undefined,
          },
          name: branchInfo.branchName,
          code: branchInfo.branchCode,
          ifscCode: branchInfo.ifscCode,
          address: branchInfo.branchAddress,
          city: branchInfo.city,
          district: branchInfo.district,
          state: branchInfo.state,
          pinCode: branchInfo.pinCode,
          phone: branchInfo.phone || undefined,
          email: branchInfo.email,
          drt: {
            name: drtJurisdiction.name,
            location: drtJurisdiction.location,
          },
        },
        admin: {
          name: personalDetails.name,
          email,
          designation: personalDetails.designation,
          mobile: personalDetails.mobile || undefined,
        },
      });

      const branchId = res.data.data?.branch?.id;
      setBranchId(branchId);

      if (letterheadFile && branchId) {
        const formData = new FormData();
        formData.append('letterhead', letterheadFile);
        formData.append('branchId', branchId);
        await apiClient.post('/onboarding/letterhead', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      nextStep();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || 'Failed to create branch. Please try again.');
      } else {
        setError('Failed to create branch. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const Section = ({ title, step, children }: { title: string; step: number; children: React.ReactNode }) => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-ink dark:text-dark-text uppercase tracking-wide">{title}</h3>
        <button onClick={() => goToStep(step)} className="text-xs text-accent hover:underline">Edit</button>
      </div>
      <div className="bg-white dark:bg-dark-bg rounded-xl border border-sand-300 dark:border-dark-border p-4">
        {children}
      </div>
    </div>
  );

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div className="py-1">
      <span className="text-xs text-ink-tertiary dark:text-dark-text-tertiary">{label}</span>
      <p className="text-sm text-ink dark:text-dark-text">{value || '—'}</p>
    </div>
  );

  return (
    <div>
      <h2 className="text-xl font-semibold text-ink dark:text-dark-text mb-1">Review &amp; Confirm</h2>
      <p className="text-sm text-ink-secondary dark:text-dark-text-secondary mb-6">
        Please review all details before creating your branch.
      </p>

      <Section title="Personal Details" step={0}>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Name" value={personalDetails.name} />
          <Field label="Designation" value={personalDetails.designation} />
          <Field label="Mobile" value={personalDetails.mobile} />
          <Field label="Email" value={email} />
        </div>
      </Section>

      <Section title="Bank Information" step={1}>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Bank Name" value={bankInfo.bankName} />
          <Field label="Bank Type" value={bankInfo.bankType} />
          <Field label="RBI Reg. No." value={bankInfo.rbiRegNo} />
          <Field label="State" value={bankInfo.state} />
          <Field label="HO Address" value={bankInfo.hoAddress} />
          <Field label="Website" value={bankInfo.website} />
        </div>
      </Section>

      <Section title="Branch Information" step={2}>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Branch Name" value={branchInfo.branchName} />
          <Field label="Branch Code" value={branchInfo.branchCode} />
          <Field label="IFSC Code" value={branchInfo.ifscCode} />
          <Field label="Address" value={branchInfo.branchAddress} />
          <Field label="City" value={branchInfo.city} />
          <Field label="District" value={branchInfo.district} />
          <Field label="State" value={branchInfo.state} />
          <Field label="PIN Code" value={branchInfo.pinCode} />
          <Field label="Phone" value={branchInfo.phone} />
          <Field label="Email" value={branchInfo.email} />
        </div>
      </Section>

      <Section title="DRT Jurisdiction" step={3}>
        <div className="grid grid-cols-2 gap-2">
          <Field label="DRT Name" value={drtJurisdiction.name} />
          <Field label="DRT Location" value={drtJurisdiction.location} />
        </div>
      </Section>

      <Section title="Letterhead" step={4}>
        <p className="text-sm text-ink dark:text-dark-text">
          {letterheadFile ? `📎 ${letterheadFile.name} (${(letterheadFile.size / 1024).toFixed(0)} KB)` : 'No letterhead uploaded'}
        </p>
      </Section>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex justify-between mt-4 pt-6 border-t border-sand-300 dark:border-dark-border">
        <button
          type="button"
          onClick={prevStep}
          className="px-6 py-2.5 rounded-xl border border-sand-300 text-ink hover:bg-sand-100 dark:border-dark-border dark:text-dark-text dark:hover:bg-dark-bg transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors font-medium disabled:opacity-50"
        >
          {loading ? 'Creating Branch...' : 'Confirm & Create Branch'}
        </button>
      </div>
    </div>
  );
}
