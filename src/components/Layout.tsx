import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

const APP_NAV = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/banks', label: 'Banks' },
  { path: '/users', label: 'App Users' },
  { path: '/audit-logs', label: 'Audit' },
  { path: '/settings', label: 'Settings' },
];

const BRANCH_NAV = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/cases', label: 'Cases' },
  { path: '/notices', label: 'Notices' },
  { path: '/review', label: 'Review Queue' },
  { path: '/registry', label: 'Registry' },
  { path: '/audit-logs', label: 'Audit Log' },
  { path: '/users', label: 'Users' },
  { path: '/settings', label: 'Settings' },
];

function oversightNav(treeLabel: string) {
  return [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/bank-tree', label: treeLabel },
    { path: '/users', label: 'Users' },
    { path: '/audit-logs', label: 'Audit Log' },
    { path: '/settings', label: 'Settings' },
  ];
}

const HO_NAV = oversightNav('Bank Tree');
const ZONAL_NAV = oversightNav('Zone Tree');
const REGIONAL_NAV = oversightNav('Region Tree');

export default function Layout() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const navItems = (() => {
    if (user?.userKind === 'app') return APP_NAV;
    switch (user?.officeType) {
      case 'HO':
        return HO_NAV;
      case 'Zonal':
        return ZONAL_NAV;
      case 'Regional':
        return REGIONAL_NAV;
      case 'Branch':
      default:
        return BRANCH_NAV;
    }
  })();
  const subtitle =
    user?.userKind === 'app'
      ? 'App Admin'
      : user?.officeType && user.officeType !== 'Branch'
      ? `${user.officeType} · ${user.branchName ?? user.bankName ?? ''}`
      : user?.branchName;

  return (
    <div className="flex h-screen bg-sand-100 dark:bg-dark-bg">
      <aside className="w-64 bg-sidebar flex flex-col">
        <div className="p-6">
          <h1 className="text-lg font-semibold text-white tracking-tight">Bank SARFAESI</h1>
          {subtitle && <p className="text-xs text-sidebar-text mt-1">{subtitle}</p>}
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                location.pathname === item.path
                  ? 'bg-sidebar-active text-sidebar-text-active'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <div className="text-sm text-sidebar-text mb-1 px-3">{user?.name || 'User'}</div>
          <button
            onClick={toggleTheme}
            className="text-sm text-sidebar-text hover:text-white px-3 py-1.5 rounded-lg hover:bg-sidebar-hover transition-colors w-full text-left flex items-center gap-2"
          >
            {theme === 'light' ? '☾' : '☀'}
            <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
          </button>
          <button
            onClick={logout}
            className="text-sm text-sidebar-text hover:text-white px-3 py-1.5 rounded-lg hover:bg-sidebar-hover transition-colors w-full text-left"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
