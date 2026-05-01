import { useEffect, useState, lazy, Suspense } from 'react';
import { useAuthStore } from '../../store/authStore';

const ProfileTab = lazy(() => import('./tabs/ProfileTab'));
const LetterheadTab = lazy(() => import('./tabs/LetterheadTab'));
const SsoConfigTab = lazy(() => import('./tabs/SsoConfigTab'));
const DrtTab = lazy(() => import('./tabs/DrtTab'));

const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'letterhead', label: 'Letterhead' },
  { key: 'sso', label: 'SSO Configuration' },
  { key: 'drt', label: 'DRT Jurisdiction' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

function getTabFromHash(): TabKey {
  const hash = window.location.hash.replace('#', '');
  if (TABS.some((t) => t.key === hash)) return hash as TabKey;
  return 'profile';
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState<TabKey>(getTabFromHash);

  useEffect(() => {
    const onHash = () => setActiveTab(getTabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const switchTab = (key: TabKey) => {
    window.location.hash = key;
    setActiveTab(key);
  };

  if (!isAdmin) {
    return (
      <div>
        <h2 className="text-2xl font-semibold text-ink dark:text-dark-text mb-6 tracking-tight">
          Branch Settings
        </h2>
        <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border p-8">
          <p className="text-ink-tertiary dark:text-dark-text-tertiary">
            Only administrators can manage branch settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-ink dark:text-dark-text mb-6 tracking-tight">
        Branch Settings
      </h2>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-sand-200 dark:border-dark-border mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${
              activeTab === tab.key
                ? 'border-b-2 border-accent text-accent'
                : 'text-ink-tertiary hover:text-ink dark:text-dark-text-tertiary dark:hover:text-dark-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border p-6">
        <Suspense
          fallback={
            <div className="h-32 flex items-center justify-center text-ink-tertiary dark:text-dark-text-tertiary">
              Loading...
            </div>
          }
        >
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'letterhead' && <LetterheadTab />}
          {activeTab === 'sso' && <SsoConfigTab />}
          {activeTab === 'drt' && <DrtTab />}
        </Suspense>
      </div>
    </div>
  );
}
