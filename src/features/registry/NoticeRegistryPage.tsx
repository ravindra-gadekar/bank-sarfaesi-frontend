import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { noticeApi, NoticeData } from '../notices/api/noticeApi';
import apiClient from '@/lib/apiClient';

const NOTICE_TYPE_LABELS: Record<string, string> = {
  demand_13_2: 'Demand §13(2)',
  possession_13_4: 'Possession §13(4)',
  sale_auction: 'Sale §8/9',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-sand-200 text-ink-secondary',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  final: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  superseded: 'bg-gray-100 text-gray-500',
};

export default function NoticeRegistryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [notices, setNotices] = useState<NoticeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [supersedingId, setSupersedingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const statusFilter = searchParams.get('status') || '';
  const typeFilter = searchParams.get('type') || '';
  const searchQ = searchParams.get('q') || '';

  const loadNotices = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;
    if (typeFilter) params.noticeType = typeFilter;
    if (searchQ) params.search = searchQ;

    return apiClient.get<{ success: boolean; data: NoticeData[] }>('/notices', { params })
      .then((res) => setNotices(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter, typeFilter, searchQ]);

  useEffect(() => { loadNotices(); }, [loadNotices]);

  const handleRegenerate = async (noticeId: string) => {
    setRegeneratingId(noticeId);
    try {
      await noticeApi.regenerateDocuments(noticeId);
      // Poll generation status until completed or failed
      const poll = async () => {
        for (let i = 0; i < 60; i++) { // max ~2 minutes
          await new Promise((r) => setTimeout(r, 2000));
          try {
            const res = await noticeApi.getGenerationStatus(noticeId);
            if (res.status === 'completed') {
              await loadNotices();
              setRegeneratingId(null);
              return;
            }
            if (res.status === 'failed') {
              await loadNotices();
              setRegeneratingId(null);
              return;
            }
          } catch {
            // Status check failed, keep polling
          }
        }
        // Timeout — stop polling
        await loadNotices();
        setRegeneratingId(null);
      };
      poll();
    } catch {
      setRegeneratingId(null);
    }
  };

  const handleSupersede = async (noticeId: string) => {
    if (!window.confirm('Create a new version of this notice? The current version will be marked as superseded.')) return;
    setSupersedingId(noticeId);
    try {
      const newNotice = await noticeApi.supersede(noticeId);
      navigate(`/notices/${newNotice._id}/edit`);
    } catch {
      alert('Failed to create new version.');
      setSupersedingId(null);
    }
  };

  const handleDelete = async (noticeId: string) => {
    if (!window.confirm('Delete this draft notice? This cannot be undone.')) return;
    setDeletingId(noticeId);
    try {
      await noticeApi.deleteDraft(noticeId);
      await loadNotices();
    } catch {
      alert('Failed to delete notice.');
    }
    setDeletingId(null);
  };

  const setFilter = (key: string, val: string) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    setSearchParams(p);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-ink dark:text-dark-text mb-6 tracking-tight">Notice Registry</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={searchQ}
          onChange={(e) => setFilter('q', e.target.value)}
          placeholder="Search notices..."
          className="px-4 py-2 rounded-xl bg-white dark:bg-dark-surface border border-sand-300 dark:border-dark-border text-sm text-ink dark:text-dark-text w-64 focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <select
          value={statusFilter}
          onChange={(e) => setFilter('status', e.target.value)}
          className="px-4 py-2 rounded-xl bg-white dark:bg-dark-surface border border-sand-300 dark:border-dark-border text-sm text-ink dark:text-dark-text"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="final">Final</option>
          <option value="superseded">Superseded</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setFilter('type', e.target.value)}
          className="px-4 py-2 rounded-xl bg-white dark:bg-dark-surface border border-sand-300 dark:border-dark-border text-sm text-ink dark:text-dark-text"
        >
          <option value="">All Types</option>
          <option value="demand_13_2">Demand §13(2)</option>
          <option value="possession_13_4">Possession §13(4)</option>
          <option value="sale_auction">Sale §8/9</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-sand-200 dark:bg-dark-surface-hover rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : notices.length === 0 ? (
        <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border p-10 text-center">
          <p className="text-ink-tertiary dark:text-dark-text-tertiary">No notices found.</p>
        </div>
      ) : (
        <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-300 dark:border-dark-border text-left">
                <th className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">Type</th>
                <th className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">Recipients</th>
                <th className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">Version</th>
                <th className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">Created</th>
                <th className="px-5 py-3 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notices.map((n) => (
                <tr key={n._id} className="border-b border-sand-200 dark:border-dark-border last:border-0 hover:bg-sand-100 dark:hover:bg-dark-surface-hover transition-colors">
                  <td className="px-5 py-3 font-medium text-ink dark:text-dark-text">{NOTICE_TYPE_LABELS[n.noticeType] || n.noticeType}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[n.status] || ''}`}>{n.status}</span>
                  </td>
                  <td className="px-5 py-3 text-ink-secondary dark:text-dark-text-secondary">{n.recipients?.length || 0}</td>
                  <td className="px-5 py-3 text-ink-secondary dark:text-dark-text-secondary text-center">v{n.version}</td>
                  <td className="px-5 py-3 text-ink-secondary dark:text-dark-text-secondary">{new Date(n.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      {n.status === 'draft' || n.status === 'rejected' ? (
                        <Link to={`/notices/${n._id}/edit`} className="text-accent text-xs font-medium hover:underline">Edit</Link>
                      ) : (
                        <Link to={`/notices/${n._id}/review`} className="text-accent text-xs font-medium hover:underline">View</Link>
                      )}
                      {n.status === 'draft' && (
                        <button
                          onClick={() => handleDelete(n._id)}
                          disabled={deletingId === n._id}
                          className="text-red-600 text-xs font-medium hover:underline disabled:opacity-50 dark:text-red-400"
                        >
                          {deletingId === n._id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                      {n.status === 'final' && n.generatedDocs.some((d) => d.format === 'zip') && regeneratingId !== n._id && (
                        <a href={noticeApi.getDownloadAllUrl(n._id)} className="text-green-600 text-xs font-medium hover:underline">Download All (ZIP)</a>
                      )}
                      {(n.status === 'approved' || n.status === 'final') && (
                        <button
                          onClick={() => handleRegenerate(n._id)}
                          disabled={regeneratingId === n._id}
                          className="text-orange-600 text-xs font-medium hover:underline disabled:opacity-50"
                        >
                          {regeneratingId === n._id ? 'Regenerating...' : 'Regenerate'}
                        </button>
                      )}
                      {n.status === 'final' && (
                        <button
                          onClick={() => handleSupersede(n._id)}
                          disabled={supersedingId === n._id}
                          className="text-purple-600 text-xs font-medium hover:underline disabled:opacity-50 dark:text-purple-400"
                        >
                          {supersedingId === n._id ? 'Creating...' : 'New Version'}
                        </button>
                      )}
                      {n.version > 1 || n.status === 'superseded' ? (
                        <Link
                          to={`/registry/versions?noticeId=${n._id}`}
                          className="text-ink-secondary text-xs font-medium hover:underline dark:text-dark-text-secondary"
                        >
                          History
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
