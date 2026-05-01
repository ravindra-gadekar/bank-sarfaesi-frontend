import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useNoticeFieldsStore } from '@/store/noticeFieldsStore';
import { noticeApi, ChatFlowConfig } from './api/noticeApi';
import { caseApi } from '../cases/api/caseApi';
import { useChatEngine } from './chat/useChatEngine';
import { useFormChatSync } from './chat/useFormChatSync';
import ChatPanel from './chat/ChatPanel';
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
  const [chatFlow, setChatFlow] = useState<ChatFlowConfig | null>(null);
  const [showChat, setShowChat] = useState(false); // mobile toggle
  const [noticeStatus, setNoticeStatus] = useState<string>('draft');
  const [noticeType, setNoticeType] = useState<string>('demand_13_2');

  // Load notice, case, and chat flow
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
          // Replace URL to include the new notice ID
          navigate(`/notices/${notice._id}/edit`, { replace: true });
        }

        if (cancelled) return;

        // Set context
        setNoticeContext(notice._id, notice.caseId, notice.noticeType);
        if (notice.fields && Object.keys(notice.fields).length > 0) {
          setFields(notice.fields);
        }
        setNoticeStatus(notice.status);
        setNoticeType(notice.noticeType);

        // Load case data
        const caseData = await caseApi.getById(notice.caseId);
        if (cancelled) return;
        setCaseData(caseData as unknown as Record<string, unknown>);

        // Load chat flow (non-fatal — form works without it)
        try {
          const flow = await noticeApi.getChatFlow(notice.noticeType);
          if (!cancelled) setChatFlow(flow);
        } catch {
          console.warn('Chat flow config not available — chat assistant disabled');
        }

        setLoading(false);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load notice');
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [noticeId]);

  // Chat engine
  const chatEngine = useChatEngine({
    questionFlow: chatFlow?.questionFlow ?? [],
    keywordAnswerMap: chatFlow?.keywordAnswerMap ?? {},
  });

  // Form → Chat sync
  useFormChatSync((key, value) => {
    chatEngine.acknowledgeFieldChange(key, value);
  });

  // Start chat once flow is loaded
  useEffect(() => {
    if (chatFlow && chatFlow.questionFlow.length > 0 && chatEngine.messages.length === 0) {
      chatEngine.startChat();
    }
  }, [chatFlow]);

  const handleSubmit = useCallback(async () => {
    const nid = useNoticeFieldsStore.getState().noticeId;
    if (!nid) return;
    try {
      // Save final fields
      await noticeApi.updateFields(nid, noticeFields);
      // Submit for review
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
        {/* Mobile chat toggle */}
        <button
          onClick={() => setShowChat(!showChat)}
          className="lg:hidden px-3 py-1.5 rounded-xl text-xs font-medium bg-accent text-white"
        >
          {showChat ? 'Show Form' : 'Chat Assistant'}
        </button>
      </div>

      {/* Dual-panel body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: Form */}
        <div className={`flex-1 overflow-hidden ${showChat ? 'hidden lg:block' : ''}`}>
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

        {/* Right panel: Chat */}
        <div className={`w-full lg:w-[380px] shrink-0 border-l border-sand-300 dark:border-dark-border overflow-hidden ${!showChat ? 'hidden lg:block' : ''}`}>
          <ChatPanel
            messages={chatEngine.messages}
            currentQuestion={chatEngine.currentQuestion}
            progress={chatEngine.getProgress()}
            onSubmitAnswer={chatEngine.submitAnswer}
            onSkip={chatEngine.skipQuestion}
            onStartOver={chatEngine.startChat}
          />
        </div>
      </div>
    </div>
  );
}
