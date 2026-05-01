import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useOnboardingStore } from '../../store/onboardingStore';
import BankInfoStep from './steps/BankInfoStep';
import BranchInfoStep from './steps/BranchInfoStep';
import PersonalStep from './steps/PersonalStep';
import DrtStep from './steps/DrtStep';
import LetterheadStep from './steps/LetterheadStep';
import ReviewStep from './steps/ReviewStep';
import CompleteStep from './steps/CompleteStep';

const STEP_LABELS = ['Personal', 'Bank Info', 'Branch Info', 'DRT', 'Letterhead', 'Review', 'Complete'];

const STEP_COMPONENTS = [
  PersonalStep,
  BankInfoStep,
  BranchInfoStep,
  DrtStep,
  LetterheadStep,
  ReviewStep,
  CompleteStep,
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8 overflow-x-auto px-2">
      {STEP_LABELS.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors ${
                i < currentStep
                  ? 'bg-accent border-accent text-white'
                  : i === currentStep
                    ? 'border-accent text-accent bg-white dark:bg-dark-surface'
                    : 'border-sand-300 text-ink-tertiary bg-white dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-tertiary'
              }`}
            >
              {i < currentStep ? '✓' : i + 1}
            </div>
            <span
              className={`text-[10px] mt-1 whitespace-nowrap ${
                i <= currentStep ? 'text-ink dark:text-dark-text font-medium' : 'text-ink-tertiary dark:text-dark-text-tertiary'
              }`}
            >
              {label}
            </span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div
              className={`w-6 h-0.5 mx-1 -mt-3 ${
                i < currentStep ? 'bg-accent' : 'bg-sand-300 dark:bg-dark-border'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function BranchSetupWizard() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { currentStep, prevStep } = useOnboardingStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  const StepComponent = STEP_COMPONENTS[currentStep];

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEP_COMPONENTS.length - 1;
  // Review + Complete steps have their own navigation
  const showBottomNav = currentStep >= 0 && currentStep <= 4;

  return (
    <div className="min-h-screen bg-sand-100 dark:bg-dark-bg flex flex-col items-center px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-ink dark:text-dark-text tracking-tight">Bank SARFAESI</h1>
        <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary mt-1">Branch Setup Wizard</p>
      </div>

      <div className="w-full max-w-2xl">
        <StepIndicator currentStep={currentStep} />

        <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl shadow-sm border border-sand-300 dark:border-dark-border p-8">
          <StepComponent />

          {showBottomNav && (
            <div className="flex justify-between mt-8 pt-6 border-t border-sand-300 dark:border-dark-border">
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2.5 rounded-xl border border-sand-300 text-ink hover:bg-sand-100 dark:border-dark-border dark:text-dark-text dark:hover:bg-dark-bg transition-colors"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                form="wizard-step-form"
                className="ml-auto px-6 py-2.5 rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors font-medium"
              >
                {isLastStep ? 'Complete Setup' : 'Continue'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
