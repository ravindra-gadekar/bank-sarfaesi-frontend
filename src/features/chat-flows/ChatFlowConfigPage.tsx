import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { chatFlowApi } from './api/chatFlowApi';
import type { ChatFlowConfig } from './types';
import { NOTICE_TYPE_LABELS } from './types';

export default function ChatFlowConfigPage() {
  const currentUser = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [configs, setConfigs] = useState<ChatFlowConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: resp } = await chatFlowApi.listConfigs();
      setConfigs(resp.data);
    } catch {
      setError('Failed to load chat flow configs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleClone = async (noticeType: string) => {
    if (!window.confirm(`Clone the global default for "${NOTICE_TYPE_LABELS[noticeType]}" to your branch?`)) return;
    try {
      const { data: resp } = await chatFlowApi.cloneFromDefault(noticeType);
      navigate(`/chat-flows/${resp.data._id}/edit`);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to clone config.';
      alert(message);
    }
  };

  const handleActivate = async (id: string) => {
    if (!window.confirm('Activate this config version? The previous active version will be deactivated.')) return;
    try {
      await chatFlowApi.activateConfig(id);
      await fetchConfigs();
    } catch {
      alert('Failed to activate config.');
    }
  };

  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  if (!isAdminOrManager) {
    return (
      <div className="text-center py-20 text-gray-500 dark:text-gray-400">
        Access restricted to Admin and Manager roles.
      </div>
    );
  }

  // Group configs by notice type
  const grouped = configs.reduce<Record<string, ChatFlowConfig[]>>((acc, cfg) => {
    (acc[cfg.noticeType] ??= []).push(cfg);
    return acc;
  }, {});

  const allNoticeTypes = ['demand_13_2', 'possession_13_4', 'sale_auction'];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Chat Flow Configs</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-500 dark:text-gray-400 py-10 text-center">Loading...</div>
      ) : (
        <div className="space-y-8">
          {allNoticeTypes.map((nt) => {
            const items = grouped[nt] ?? [];
            const branchConfigs = items.filter((c) => c.branchId !== null);
            const globalConfigs = items.filter((c) => c.branchId === null);
            const hasBranchConfig = branchConfigs.length > 0;

            return (
              <section key={nt} className="bg-white dark:bg-dark-card rounded-xl shadow-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {NOTICE_TYPE_LABELS[nt] || nt}
                  </h2>
                  {!hasBranchConfig && (
                    <button
                      onClick={() => handleClone(nt)}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                    >
                      Customize for Branch
                    </button>
                  )}
                </div>

                {/* Branch-specific configs */}
                {branchConfigs.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Branch Configs</h3>
                    <ConfigTable
                      configs={branchConfigs}
                      onEdit={(id) => navigate(`/chat-flows/${id}/edit`)}
                      onActivate={handleActivate}
                      onPreview={(id) => navigate(`/chat-flows/${id}/preview`)}
                    />
                  </div>
                )}

                {/* Global defaults */}
                {globalConfigs.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Global Default{hasBranchConfig ? ' (fallback)' : ''}
                    </h3>
                    <ConfigTable
                      configs={globalConfigs}
                      isGlobal
                      onPreview={(id) => navigate(`/chat-flows/${id}/preview`)}
                    />
                  </div>
                )}

                {items.length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-gray-500">No config available.</p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ConfigTable({
  configs,
  isGlobal,
  onEdit,
  onActivate,
  onPreview,
}: {
  configs: ChatFlowConfig[];
  isGlobal?: boolean;
  onEdit?: (id: string) => void;
  onActivate?: (id: string) => void;
  onPreview?: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <th className="pb-2 font-medium">Version</th>
            <th className="pb-2 font-medium">Questions</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Effective From</th>
            <th className="pb-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {configs.map((cfg) => (
            <tr key={cfg._id}>
              <td className="py-2 text-gray-900 dark:text-gray-100">v{cfg.version}</td>
              <td className="py-2 text-gray-600 dark:text-gray-300">{cfg.questionFlow.length} nodes</td>
              <td className="py-2">
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                    cfg.isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {cfg.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="py-2 text-gray-600 dark:text-gray-300">
                {new Date(cfg.effectiveFrom).toLocaleDateString()}
              </td>
              <td className="py-2 text-right space-x-2">
                {onPreview && (
                  <button
                    onClick={() => onPreview(cfg._id)}
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Preview
                  </button>
                )}
                {onEdit && !isGlobal && (
                  <button
                    onClick={() => onEdit(cfg._id)}
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Edit
                  </button>
                )}
                {onActivate && !isGlobal && !cfg.isActive && (
                  <button
                    onClick={() => onActivate(cfg._id)}
                    className="text-xs text-green-600 hover:underline dark:text-green-400"
                  >
                    Activate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
