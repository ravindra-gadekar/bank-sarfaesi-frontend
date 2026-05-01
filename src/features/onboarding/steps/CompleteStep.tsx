import { useNavigate } from 'react-router-dom';
import { useOnboardingStore } from '../../../store/onboardingStore';

export default function CompleteStep() {
  const navigate = useNavigate();
  const { bankInfo, branchInfo, reset } = useOnboardingStore();

  const handleGoToBranches = () => {
    reset();
    navigate('/branches');
  };

  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-2xl font-semibold text-ink dark:text-dark-text mb-2">Branch Created Successfully!</h2>
      <p className="text-ink-secondary dark:text-dark-text-secondary mb-6">
        Your branch has been registered and is ready to use.
      </p>

      <div className="bg-white dark:bg-dark-bg rounded-xl border border-sand-300 dark:border-dark-border p-4 max-w-sm mx-auto mb-8">
        <div className="text-sm text-ink-tertiary dark:text-dark-text-tertiary">Bank</div>
        <div className="text-ink dark:text-dark-text font-medium">{bankInfo.bankName}</div>
        <div className="text-sm text-ink-tertiary dark:text-dark-text-tertiary mt-2">Branch</div>
        <div className="text-ink dark:text-dark-text font-medium">{branchInfo.branchName}</div>
      </div>

      <button
        onClick={handleGoToBranches}
        className="px-8 py-2.5 rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors font-medium"
      >
        Go to Branch Selection
      </button>
    </div>
  );
}
