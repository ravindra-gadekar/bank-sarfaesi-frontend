import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { useOnboardingStore } from '../../../store/onboardingStore';
import { INDIAN_STATES } from '../../../lib/constants';

const BANK_TYPES = [
  'Scheduled Commercial Bank',
  'Regional Rural Bank',
  'Cooperative Bank',
  'Small Finance Bank',
  'NBFC',
] as const;

const schema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  bankType: z.string().min(1, 'Select a bank type'),
  rbiRegNo: z.string().min(1, 'RBI registration number is required'),
  hoAddress: z.string().min(1, 'Head office address is required'),
  state: z.string().min(1, 'Select a state'),
  website: z.string().url('Enter a valid URL').or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export default function BankInfoStep() {
  const { bankInfo, setBankInfo, nextStep } = useOnboardingStore();

  const { register, handleSubmit, setError, formState: { errors } } = useForm<FormData>({
    defaultValues: bankInfo,
  });

  const onSubmit = (data: FormData) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormData;
        setError(field, { message: issue.message });
      }
      return;
    }
    setBankInfo(result.data);
    nextStep();
  };

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-sand-300 bg-white text-ink placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent dark:bg-dark-surface dark:border-dark-border dark:text-dark-text dark:placeholder:text-dark-text-tertiary';
  const selectClass = `${inputClass} appearance-none`;

  return (
    <div>
      <h2 className="text-xl font-semibold text-ink dark:text-dark-text mb-1">Bank Information</h2>
      <p className="text-sm text-ink-secondary dark:text-dark-text-secondary mb-6">Details about your bank</p>

      <form id="wizard-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="bankName" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
            Bank Name <span className="text-red-500">*</span>
          </label>
          <input id="bankName" {...register('bankName')} className={inputClass} placeholder="e.g. State Bank of India" />
          {errors.bankName && <p className="text-red-500 text-xs mt-1">{errors.bankName.message}</p>}
        </div>

        <div>
          <label htmlFor="bankType" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
            Bank Type <span className="text-red-500">*</span>
          </label>
          <select id="bankType" {...register('bankType')} className={selectClass}>
            <option value="">Select bank type</option>
            {BANK_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {errors.bankType && <p className="text-red-500 text-xs mt-1">{errors.bankType.message}</p>}
        </div>

        <div>
          <label htmlFor="rbiRegNo" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
            RBI Registration No. <span className="text-red-500">*</span>
          </label>
          <input id="rbiRegNo" {...register('rbiRegNo')} className={inputClass} placeholder="e.g. RBI/2024/001" />
          {errors.rbiRegNo && <p className="text-red-500 text-xs mt-1">{errors.rbiRegNo.message}</p>}
        </div>

        <div>
          <label htmlFor="hoAddress" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
            Head Office Address <span className="text-red-500">*</span>
          </label>
          <textarea id="hoAddress" {...register('hoAddress')} rows={2} className={inputClass} placeholder="Full address of head office" />
          {errors.hoAddress && <p className="text-red-500 text-xs mt-1">{errors.hoAddress.message}</p>}
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
            State <span className="text-red-500">*</span>
          </label>
          <select id="state" {...register('state')} className={selectClass}>
            <option value="">Select state</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
            Website <span className="text-ink-tertiary dark:text-dark-text-tertiary">(optional)</span>
          </label>
          <input id="website" {...register('website')} className={inputClass} placeholder="https://www.bank.com" />
          {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website.message}</p>}
        </div>
      </form>
    </div>
  );
}
