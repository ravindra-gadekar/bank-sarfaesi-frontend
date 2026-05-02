import { lazy, Suspense } from 'react';
import { useAuthStore } from '../../store/authStore';

const AppUsersView = lazy(() => import('../app-admin/AppUsersView'));
const BankUsersView = lazy(() => import('./BankUsersView'));

export default function UserListPage() {
  const userKind = useAuthStore((s) => s.user?.userKind);
  return (
    <Suspense fallback={<div className="text-ink-secondary dark:text-dark-text-secondary">Loading…</div>}>
      {userKind === 'app' ? <AppUsersView /> : <BankUsersView />}
    </Suspense>
  );
}
