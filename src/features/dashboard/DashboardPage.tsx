import { lazy, Suspense } from 'react';
import { useAuthStore } from '../../store/authStore';

const AppDashboardView = lazy(() => import('../app-admin/AppDashboardView'));
const BankDashboardView = lazy(() => import('./BankDashboardView'));

export default function DashboardPage() {
  const userKind = useAuthStore((s) => s.user?.userKind);
  return (
    <Suspense fallback={<div className="text-ink-secondary dark:text-dark-text-secondary">Loading…</div>}>
      {userKind === 'app' ? <AppDashboardView /> : <BankDashboardView />}
    </Suspense>
  );
}
