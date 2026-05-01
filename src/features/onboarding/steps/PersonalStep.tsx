import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { useOnboardingStore } from '../../../store/onboardingStore';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  designation: z.string().min(1, 'Designation is required'),
  mobile: z.string().regex(/^(\+91[\-\s]?)?[6-9]\d{9}$/, 'Enter a valid Indian mobile number').or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export default function PersonalStep() {
  const { personalDetails, setPersonalDetails, nextStep } = useOnboardingStore();

  const { register, handleSubmit, setError, formState: { errors } } = useForm<FormData>({
    defaultValues: personalDetails,
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
    setPersonalDetails(result.data);
    nextStep();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-ink dark:text-dark-text mb-1">Personal Details</h2>
      <p className="text-sm text-ink-secondary dark:text-dark-text-secondary mb-6">Tell us about yourself</p>

      <form id="wizard-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            {...register('name')}
            className="w-full px-4 py-2.5 rounded-xl border border-sand-300 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent dark:bg-dark-surface dark:border-dark-border dark:text-dark-text"
            placeholder="Enter your full name"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="designation" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
            Designation <span className="text-red-500">*</span>
          </label>
          <input
            id="designation"
            {...register('designation')}
            className="w-full px-4 py-2.5 rounded-xl border border-sand-300 bg-white text-ink placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent dark:bg-dark-surface dark:border-dark-border dark:text-dark-text dark:placeholder:text-dark-text-tertiary"
            placeholder="e.g. Branch Manager"
          />
          {errors.designation && <p className="text-red-500 text-xs mt-1">{errors.designation.message}</p>}
        </div>

        <div>
          <label htmlFor="mobile" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
            Mobile Number <span className="text-ink-tertiary dark:text-dark-text-tertiary">(optional)</span>
          </label>
          <input
            id="mobile"
            {...register('mobile')}
            className="w-full px-4 py-2.5 rounded-xl border border-sand-300 bg-white text-ink placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent dark:bg-dark-surface dark:border-dark-border dark:text-dark-text dark:placeholder:text-dark-text-tertiary"
            placeholder="+91 9876543210"
          />
          {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile.message}</p>}
        </div>
      </form>
    </div>
  );
}
