import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { noticeApi, NoticeData } from '../notices/api/noticeApi';
import { caseApi } from '../cases/api/caseApi';
import { useNoticeFieldsStore } from '@/store/noticeFieldsStore';
import NoticePreview from '../notices/preview/NoticePreview';

export default function ReviewPage() {
  const { noticeId } = useParams<{ noticeId: string }>();
  const navigate = useNavigate();

  const { setNoticeContext, setFields, setCaseData, resetFields } = useNoticeFieldsStore();

  const [notice, setNotice] = useState<NoticeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!noticeId) return;
    let cancelled = false;
    const load = async () => {
      try {
        resetFields();
        const n = await noticeApi.getById(noticeId);
        if (cancelled) return;
        setNotice(n);
        setNoticeContext(n._id, n.caseId, n.noticeType);
        if (n.fields) setFields(n.fields);

        const c = await caseApi.getById(n.caseId);
        if (cancelled) return;
        setCaseData(c as unknown as Record<string, unknown>);
        setLoading(false);
      } catch {
        if (!cancelled) setError('Failed to load notice');
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [noticeId]);

  const handleApprove = useCallback(async () => {
    if (!noticeId) return;
    setActionLoading(true);
    try {
      await noticeApi.approve(noticeId, comment || undefined);
      navigate('/review');
    } catch {
      setError('Failed to approve');
    }
    setActionLoading(false);
  }, [noticeId, comment, navigate]);

  const handleReject = useCallback(async () => {
    if (!noticeId || !comment.trim()) {
      setError('A comment is required when rejecting.');
      return;
    }
    setActionLoading(true);
    try {
      await noticeApi.reject(noticeId, comment);
      navigate('/review');
    } catch {
      setError('Failed to reject');
    }
    setActionLoading(false);
  }, [noticeId, comment, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-ink-tertiary dark:text-dark-text-tertiary">Loading notice for review...</div>
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">{error || 'Notice not found'}</p>
        <button onClick={() => navigate('/review')} className="text-accent hover:underline text-sm">Back to queue</button>
      </div>
    );
  }

  const isReviewable = notice.status === 'submitted';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/review')} className="text-sm text-accent hover:underline mb-1">← Back to queue</button>
          <h2 className="text-2xl font-semibold text-ink dark:text-dark-text tracking-tight">Review Notice</h2>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
          notice.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
          notice.status === 'approved' ? 'bg-green-100 text-green-700' :
          notice.status === 'rejected' ? 'bg-red-100 text-red-700' :
          'bg-sand-200 text-ink-secondary'
        }`}>{notice.status}</span>
      </div>

      {/* Notice Preview */}
      <NoticePreview />

      {/* Action Panel */}
      {isReviewable && (
        <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border p-6 space-y-4">
          <h3 className="text-lg font-medium text-ink dark:text-dark-text">Reviewer Action</h3>
          <div>
            <label className="block text-sm font-medium text-ink-secondary dark:text-dark-text-secondary mb-1">
              Comment {notice.status === 'submitted' ? '(required for rejection)' : ''}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-dark-surface-hover border border-sand-300 dark:border-dark-border text-ink dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="Add review comments..."
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Approve'}
            </button>
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Reject'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
