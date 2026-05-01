import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/cases', label: 'Cases' },
  { path: '/review', label: 'Review Queue' },
  { path: '/registry', label: 'Registry' },
  { path: '/audit-logs', label: 'Audit Log' },
  { path: '/users', label: 'Users' },
  { path: '/chat-flows', label: 'Chat Flows' },
  { path: '/settings', label: 'Settings' },
];

export default function Layout() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <div className="flex h-screen bg-sand-100 dark:bg-dark-bg">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar flex flex-col">
        <div className="p-6">
          <h1 className="text-lg font-semibold text-white tracking-tight">Bank SARFAESI</h1>
          {user?.branchName && (
            <p className="text-xs text-sidebar-text mt-1">{user.branchName}</p>
          )}
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
            {theme === 'light' ? '\u263E' : '\u2600'}
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

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
