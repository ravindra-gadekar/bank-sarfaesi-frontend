import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { branchApi } from '../api/branchApi';

interface DrtForm {
  drtName: string;
  drtLocation: string;
}

// Basic DRT lookup data (state/district → suggested DRT)
const DRT_SUGGESTIONS: Record<string, { name: string; location: string }> = {
  maharashtra: { name: 'DRT Mumbai', location: 'Mumbai' },
  karnataka: { name: 'DRT Bengaluru', location: 'Bengaluru' },
  'tamil nadu': { name: 'DRT Chennai', location: 'Chennai' },
  delhi: { name: 'DRT Delhi', location: 'New Delhi' },
  'west bengal': { name: 'DRT Kolkata', location: 'Kolkata' },
  gujarat: { name: 'DRT Ahmedabad', location: 'Ahmedabad' },
  'uttar pradesh': { name: 'DRT Allahabad', location: 'Allahabad' },
  rajasthan: { name: 'DRT Jaipur', location: 'Jaipur' },
  'madhya pradesh': { name: 'DRT Jabalpur', location: 'Jabalpur' },
  telangana: { name: 'DRT Hyderabad', location: 'Hyderabad' },
  'andhra pradesh': { name: 'DRT Hyderabad', location: 'Hyderabad' },
  kerala: { name: 'DRT Ernakulam', location: 'Ernakulam' },
  punjab: { name: 'DRT Chandigarh', location: 'Chandigarh' },
  haryana: { name: 'DRT Chandigarh', location: 'Chandigarh' },
};

export default function DrtTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branchState, setBranchState] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { register, handleSubmit, reset, setValue } = useForm<DrtForm>();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await branchApi.getBranch();
        reset({
          drtName: data.drt?.name || data.drtName || '',
          drtLocation: data.drt?.location || data.drtLocation || '',
        });
        if (data.state) setBranchState(data.state);
      } catch {
        setMessage({ type: 'error', text: 'Failed to load DRT info.' });
      } finally {
        setLoading(false);
      }
    })();
  }, [reset]);

  const handleLookup = () => {
    const key = branchState.toLowerCase().trim();
    const suggestion = DRT_SUGGESTIONS[key];
    if (suggestion) {
      setValue('drtName', suggestion.name);
      setValue('drtLocation', suggestion.location);
    } else {
      setMessage({ type: 'error', text: `No DRT suggestion found for state "${branchState}". Please enter manually.` });
    }
  };

  const onSubmit = async (values: DrtForm) => {
    setSaving(true);
    setMessage(null);
    try {
      await branchApi.updateBranch({
        drt: { name: values.drtName, location: values.drtLocation },
      });
      setMessage({ type: 'success', text: 'DRT jurisdiction saved.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save DRT jurisdiction.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-md">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-10 bg-sand-200 dark:bg-dark-border rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const inputCls =
    'w-full px-4 py-2.5 rounded-xl border border-sand-300 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent dark:bg-dark-surface dark:border-dark-border dark:text-dark-text';
  const labelCls = 'block text-sm font-medium text-ink-secondary dark:text-dark-text-secondary mb-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-md">
      <div>
        <label className={labelCls}>DRT Name</label>
        <input {...register('drtName')} className={inputCls} placeholder="e.g. DRT Mumbai" />
      </div>

      <div>
        <label className={labelCls}>DRT Location</label>
        <input {...register('drtLocation')} className={inputCls} placeholder="e.g. Mumbai" />
      </div>

      <button
        type="button"
        onClick={handleLookup}
        disabled={!branchState}
        className="border border-sand-300 text-ink py-2 px-4 rounded-xl text-sm font-medium hover:bg-sand-200 transition-colors disabled:opacity-50 dark:border-dark-border dark:text-dark-text"
      >
        Lookup (based on branch state: {branchState || 'N/A'})
      </button>

      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="bg-accent text-white py-2.5 px-4 rounded-xl font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
