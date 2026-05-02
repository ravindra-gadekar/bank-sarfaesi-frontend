import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { userApi } from './api/userApi';
import BankUserInviteModal from '../invites/BankUserInviteModal';

const ROLES = ['admin', 'manager', 'maker', 'checker', 'auditor'] as const;

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  manager: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  maker: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  checker: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  auditor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

interface UserRow {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
}

export default function UserListPage() {
  const currentUser = useAuthStore((s) => s.user);
  const offices = useAuthStore((s) => s.offices);
  const selectedOfficeId = useAuthStore((s) => s.selectedOfficeId);
  const selectedOffice = useMemo(
    () => offices.find((o) => o.officeId === selectedOfficeId),
    [offices, selectedOfficeId],
  );
  const isAdmin = currentUser?.role === 'admin';
  const isAdminOrManager = isAdmin || currentUser?.role === 'manager';

  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  const limit = 20;

  const fetchUsers = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const { data: resp } = await userApi.listUsers(p, limit);
      const result = resp.data;
      setUsers(result.users);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setPage(result.page);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(page);
  }, [fetchUsers, page]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, search]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!window.confirm(`Change this user's role to ${newRole}?`)) return;
    try {
      await userApi.updateRole(userId, newRole);
      await fetchUsers(page);
    } catch {
      alert('Failed to update role.');
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!window.confirm('Deactivate this user? They will lose access.')) return;
    try {
      await userApi.deactivate(userId);
      await fetchUsers(page);
    } catch {
      alert('Failed to deactivate user.');
    }
  };

  if (!isAdminOrManager) {
    return (
      <div>
        <h2 className="text-2xl font-semibold text-ink dark:text-dark-text mb-6 tracking-tight">
          User Management
        </h2>
        <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border p-8">
          <p className="text-ink-tertiary dark:text-dark-text-tertiary">
            Only administrators and managers can access user management.
          </p>
        </div>
      </div>
    );
  }

  const startIdx = (page - 1) * limit + 1;
  const endIdx = Math.min(page * limit, total);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-ink dark:text-dark-text tracking-tight">
          User Management
        </h2>
        {isAdmin && (
          <button
            onClick={() => setShowInvite(true)}
            className="bg-accent text-white py-2.5 px-4 rounded-xl font-medium hover:bg-accent-hover transition-colors"
          >
            Invite User
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-sand-300 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent dark:bg-dark-surface dark:border-dark-border dark:text-dark-text"
        />
      </div>

      {/* Error */}
      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>}

      {/* Table */}
      <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl shadow-sm border border-sand-300 dark:border-dark-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 dark:border-dark-border text-left">
              <th className="px-6 py-3 font-medium text-ink-secondary dark:text-dark-text-secondary">Name</th>
              <th className="px-6 py-3 font-medium text-ink-secondary dark:text-dark-text-secondary">Email</th>
              <th className="px-6 py-3 font-medium text-ink-secondary dark:text-dark-text-secondary">Role</th>
              <th className="px-6 py-3 font-medium text-ink-secondary dark:text-dark-text-secondary">Status</th>
              <th className="px-6 py-3 font-medium text-ink-secondary dark:text-dark-text-secondary">Last Login</th>
              {isAdmin && (
                <th className="px-6 py-3 font-medium text-ink-secondary dark:text-dark-text-secondary">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-200 dark:divide-dark-border">
            {loading ? (
              // Skeleton rows
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: isAdmin ? 6 : 5 }).map((__, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-sand-200 dark:bg-dark-border rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 6 : 5}
                  className="px-6 py-12 text-center text-ink-tertiary dark:text-dark-text-tertiary"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isSelf = u._id === currentUser?.id;
                return (
                  <tr key={u._id} className="hover:bg-sand-100 dark:hover:bg-dark-bg/50 transition-colors">
                    <td className="px-6 py-4 text-ink dark:text-dark-text font-medium">{u.name}</td>
                    <td className="px-6 py-4 text-ink-secondary dark:text-dark-text-secondary">{u.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[u.role] || 'bg-gray-100 text-gray-700'}`}
                      >
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-ink-tertiary dark:text-dark-text-tertiary text-xs">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '—'}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        {!isSelf && u.isActive && (
                          <div className="flex items-center gap-2">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              className="px-2 py-1 text-xs rounded-lg border border-sand-300 bg-white dark:bg-dark-surface dark:border-dark-border dark:text-dark-text focus:outline-none"
                            >
                              {ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {r.charAt(0).toUpperCase() + r.slice(1)}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleDeactivate(u._id)}
                              className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                            >
                              Deactivate
                            </button>
                          </div>
                        )}
                        {isSelf && (
                          <span className="text-xs text-ink-tertiary dark:text-dark-text-tertiary">You</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-ink-secondary dark:text-dark-text-secondary">
          <span>
            Showing {startIdx}–{endIdx} of {total}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="border border-sand-300 text-ink py-1.5 px-3 rounded-lg font-medium hover:bg-sand-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed dark:border-dark-border dark:text-dark-text"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="border border-sand-300 text-ink py-1.5 px-3 rounded-lg font-medium hover:bg-sand-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed dark:border-dark-border dark:text-dark-text"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <BankUserInviteModal
          inviterOfficeType={selectedOffice?.officeType ?? 'Branch'}
          inviterBankName={selectedOffice?.bankName ?? ''}
          defaultTargetOfficeId={currentUser?.officeId ?? currentUser?.branchId ?? selectedOfficeId ?? undefined}
          onClose={() => setShowInvite(false)}
          onSuccess={() => fetchUsers(page)}
        />
      )}
    </div>
  );
}
