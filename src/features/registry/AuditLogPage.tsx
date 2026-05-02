import { lazy, Suspense } from 'react';
import { useAuthStore } from '../../store/authStore';

const AppAuditView = lazy(() => import('../app-admin/AppAuditView'));
const BankAuditView = lazy(() => import('./BankAuditView'));

export default function AuditLogPage() {
  const userKind = useAuthStore((s) => s.user?.userKind);
  return (
    <Suspense fallback={<div className="text-ink-secondary dark:text-dark-text-secondary">Loading…</div>}>
      {userKind === 'app' ? <AppAuditView /> : <BankAuditView />}
    </Suspense>
  );
}
