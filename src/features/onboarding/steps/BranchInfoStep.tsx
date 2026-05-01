import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { useOnboardingStore } from '../../../store/onboardingStore';
import { INDIAN_STATES } from '../../../lib/constants';

const schema = z.object({
  branchName: z.string().min(1, 'Branch name is required'),
  branchCode: z.string().min(1, 'Branch code is required'),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'IFSC must be 4 letters + 0 + 6 alphanumeric (e.g. SBIN0001234)'),
  branchAddress: z.string().min(1, 'Branch address is required'),
  city: z.string().min(1, 'City is required'),
  district: z.string().min(1, 'District is required'),
  state: z.string().min(1, 'Select a state'),
  pinCode: z.string().regex(/^\d{6}$/, 'PIN code must be exactly 6 digits'),
  phone: z.string().regex(/^(\+91[\-\s]?)?[6-9]\d{9}$/, 'Enter a valid phone number').or(z.literal('')),
  email: z.string().email('Enter a valid email'),
});

type FormData = z.infer<typeof schema>;

export default function BranchInfoStep() {
  const { branchInfo, setBranchInfo, nextStep } = useOnboardingStore();

  const { register, handleSubmit, setError, formState: { errors } } = useForm<FormData>({
    defaultValues: branchInfo,
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
    setBranchInfo(result.data);
    nextStep();
  };

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-sand-300 bg-white text-ink placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent dark:bg-dark-surface dark:border-dark-border dark:text-dark-text dark:placeholder:text-dark-text-tertiary';
  const selectClass = `${inputClass} appearance-none`;

  return (
    <div>
      <h2 className="text-xl font-semibold text-ink dark:text-dark-text mb-1">Branch Information</h2>
      <p className="text-sm text-ink-secondary dark:text-dark-text-secondary mb-6">Details about your branch</p>

      <form id="wizard-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="branchName" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
              Branch Name <span className="text-red-500">*</span>
            </label>
            <input id="branchName" {...register('branchName')} className={inputClass} placeholder="e.g. Mumbai Main Branch" />
            {errors.branchName && <p className="text-red-500 text-xs mt-1">{errors.branchName.message}</p>}
          </div>

          <div>
            <label htmlFor="branchCode" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
              Branch Code <span className="text-red-500">*</span>
            </label>
            <input id="branchCode" {...register('branchCode')} className={inputClass} placeholder="e.g. 001234" />
            {errors.branchCode && <p className="text-red-500 text-xs mt-1">{errors.branchCode.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ifscCode" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
              IFSC Code <span className="text-red-500">*</span>
            </label>
            <input
              id="ifscCode"
              {...register('ifscCode', { setValueAs: (v: string) => v.toUpperCase() })}
              className={inputClass}
              placeholder="e.g. SBIN0001234"
              style={{ textTransform: 'uppercase' }}
            />
            {errors.ifscCode && <p className="text-red-500 text-xs mt-1">{errors.ifscCode.message}</p>}
          </div>

          <div>
            <label htmlFor="pinCode" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
              PIN Code <span className="text-red-500">*</span>
            </label>
            <input id="pinCode" {...register('pinCode')} className={inputClass} placeholder="e.g. 400001" maxLength={6} />
            {errors.pinCode && <p className="text-red-500 text-xs mt-1">{errors.pinCode.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="branchAddress" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
            Branch Address <span className="text-red-500">*</span>
          </label>
          <textarea id="branchAddress" {...register('branchAddress')} rows={2} className={inputClass} placeholder="Full branch address" />
          {errors.branchAddress && <p className="text-red-500 text-xs mt-1">{errors.branchAddress.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input id="city" {...register('city')} className={inputClass} placeholder="e.g. Mumbai" />
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
          </div>

          <div>
            <label htmlFor="district" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
              District <span className="text-red-500">*</span>
            </label>
            <input id="district" {...register('district')} className={inputClass} placeholder="e.g. Mumbai Suburban" />
            {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district.message}</p>}
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
              State <span className="text-red-500">*</span>
            </label>
            <select id="state" {...register('state')} className={selectClass}>
              <option value="">Select</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
              Phone <span className="text-ink-tertiary dark:text-dark-text-tertiary">(optional)</span>
            </label>
            <input id="phone" {...register('phone')} className={inputClass} placeholder="+91 9876543210" />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
              Branch Email <span className="text-red-500">*</span>
            </label>
            <input id="email" type="email" {...register('email')} className={inputClass} placeholder="branch@bank.com" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
        </div>
      </form>
    </div>
  );
}
