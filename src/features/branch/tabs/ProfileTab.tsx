import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { branchApi } from '../api/branchApi';

interface ProfileForm {
  bankName: string;
  bankType: string;
  rbiRegNo: string;
  branchName: string;
  branchCode: string;
  ifsc: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pinCode: string;
  phone: string;
  email: string;
}

export default function ProfileTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await branchApi.getBranch();
        reset({
          bankName: data.bankName || '',
          bankType: data.bankType || '',
          rbiRegNo: data.rbiRegNo || '',
          branchName: data.branchName || '',
          branchCode: data.branchCode || '',
          ifsc: data.ifsc || '',
          address: data.address || '',
          city: data.city || '',
          district: data.district || '',
          state: data.state || '',
          pinCode: data.pinCode || '',
          phone: data.phone || '',
          email: data.email || '',
        });
      } catch {
        setMessage({ type: 'error', text: 'Failed to load branch profile.' });
      } finally {
        setLoading(false);
      }
    })();
  }, [reset]);

  const onSubmit = async (values: ProfileForm) => {
    setSaving(true);
    setMessage(null);
    try {
      await branchApi.updateBranch(values as unknown as Record<string, unknown>);
      setMessage({ type: 'success', text: 'Branch profile updated.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save changes.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-sand-200 dark:bg-dark-border rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const inputCls =
    'w-full px-4 py-2.5 rounded-xl border border-sand-300 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent dark:bg-dark-surface dark:border-dark-border dark:text-dark-text';
  const labelCls = 'block text-sm font-medium text-ink-secondary dark:text-dark-text-secondary mb-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Bank Name</label>
          <input {...register('bankName', { required: 'Required' })} className={inputCls} />
          {errors.bankName && <p className="text-xs text-red-600 mt-1">{errors.bankName.message}</p>}
        </div>
        <div>
          <label className={labelCls}>Bank Type</label>
          <select {...register('bankType')} className={inputCls}>
            <option value="">Select</option>
            <option value="nationalised">Nationalised</option>
            <option value="private">Private</option>
            <option value="cooperative">Cooperative</option>
            <option value="rrb">RRB</option>
            <option value="sfb">Small Finance Bank</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>RBI Registration No.</label>
          <input {...register('rbiRegNo')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Branch Name</label>
          <input {...register('branchName', { required: 'Required' })} className={inputCls} />
          {errors.branchName && <p className="text-xs text-red-600 mt-1">{errors.branchName.message}</p>}
        </div>
        <div>
          <label className={labelCls}>Branch Code</label>
          <input {...register('branchCode')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>IFSC</label>
          <input {...register('ifsc')} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Address</label>
        <textarea {...register('address')} rows={2} className={inputCls} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>City</label>
          <input {...register('city')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>District</label>
          <input {...register('district')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>State</label>
          <input {...register('state')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>PIN Code</label>
          <input {...register('pinCode')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Phone</label>
          <input {...register('phone')} type="tel" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input {...register('email')} type="email" className={inputCls} />
        </div>
      </div>

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
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
