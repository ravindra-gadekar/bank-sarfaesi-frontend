import { lazy, Suspense } from 'react';
import { useAuthStore } from '../../store/authStore';

const OversightDashboardView = lazy(() => import('../bank-oversight/OversightDashboardView'));
const BranchDashboardView = lazy(() => import('./BranchDashboardView'));

export default function BankDashboardView() {
  const officeType = useAuthStore((s) => s.user?.officeType ?? 'Branch');
  return (
    <Suspense fallback={<div className="text-ink-secondary dark:text-dark-text-secondary">Loading…</div>}>
      {officeType === 'Branch' ? <BranchDashboardView /> : <OversightDashboardView />}
    </Suspense>
  );
}
