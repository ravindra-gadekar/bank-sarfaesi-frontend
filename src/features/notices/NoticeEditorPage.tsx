import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useNoticeFieldsStore } from '@/store/noticeFieldsStore';
import { noticeApi } from './api/noticeApi';
import { caseApi } from '../cases/api/caseApi';
import DemandNoticeForm from './forms/DemandNoticeForm';
import PossessionNoticeForm from './forms/PossessionNoticeForm';
import SaleAuctionNoticeForm from './forms/SaleAuctionNoticeForm';

const NOTICE_TITLES: Record<string, string> = {
  demand_13_2: 'Demand Notice — Section 13(2)',
  possession_13_4: 'Possession Notice — Section 13(4)',
  sale_auction: 'Sale / Auction Notice — Rule 8/9',
};

export default function NoticeEditorPage() {
  const { noticeId } = useParams<{ noticeId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { setNoticeContext, setCaseData, setFields, resetFields, noticeFields } = useNoticeFieldsStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noticeStatus, setNoticeStatus] = useState<string>('draft');
  const [noticeType, setNoticeType] = useState<string>('demand_13_2');

  // Load notice + case
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        resetFields();

        let notice;
        if (noticeId && noticeId !== 'new') {
          notice = await noticeApi.getById(noticeId);
        } else {
          const caseId = searchParams.get('caseId');
          const noticeType = searchParams.get('type') || 'demand_13_2';
          if (!caseId) { setError('Missing caseId'); return; }
          notice = await noticeApi.createDraft(caseId, noticeType);
          navigate(`/notices/${notice._id}/edit`, { replace: true });
        }

        if (cancelled) return;

        setNoticeContext(notice._id, notice.caseId, notice.noticeType);
        if (notice.fields && Object.keys(notice.fields).length > 0) {
          setFields(notice.fields);
        }
        setNoticeStatus(notice.status);
        setNoticeType(notice.noticeType);

        const caseData = await caseApi.getById(notice.caseId);
        if (cancelled) return;
        setCaseData(caseData as unknown as Record<string, unknown>);

        setLoading(false);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load notice');
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [noticeId]);

  const handleSubmit = useCallback(async () => {
    const nid = useNoticeFieldsStore.getState().noticeId;
    if (!nid) return;
    try {
      await noticeApi.updateFields(nid, noticeFields);
      await noticeApi.submit(nid);
      navigate('/cases');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    }
  }, [noticeFields, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-ink-tertiary dark:text-dark-text-tertiary">Loading notice editor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-red-500">{error}</p>
        <button onClick={() => navigate(-1)} className="text-accent hover:underline text-sm">Go back</button>
      </div>
    );
  }

  const isReadOnly = noticeStatus !== 'draft' && noticeStatus !== 'rejected';

  return (
    <div className="h-full flex flex-col -m-8">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 bg-sand-50 dark:bg-dark-surface border-b border-sand-300 dark:border-dark-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-sm text-accent hover:underline">← Back</button>
          <h1 className="text-lg font-semibold text-ink dark:text-dark-text">{NOTICE_TITLES[noticeType] || 'Notice'}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            noticeStatus === 'draft' ? 'bg-sand-200 text-ink-secondary' :
            noticeStatus === 'submitted' ? 'bg-blue-100 text-blue-700' :
            noticeStatus === 'approved' ? 'bg-green-100 text-green-700' :
            noticeStatus === 'rejected' ? 'bg-red-100 text-red-700' :
            'bg-sand-200 text-ink-secondary'
          }`}>{noticeStatus}</span>
        </div>
      </div>

      {/* Form (full width — chat panel removed) */}
      <div className="flex-1 overflow-hidden">
        {isReadOnly ? (
          <div className="p-6 text-center text-ink-tertiary dark:text-dark-text-tertiary">
            This notice is read-only ({noticeStatus}).
          </div>
        ) : noticeType === 'possession_13_4' ? (
          <PossessionNoticeForm onSubmit={handleSubmit} />
        ) : noticeType === 'sale_auction' ? (
          <SaleAuctionNoticeForm onSubmit={handleSubmit} />
        ) : (
          <DemandNoticeForm onSubmit={handleSubmit} />
        )}
      </div>
    </div>
  );
}
