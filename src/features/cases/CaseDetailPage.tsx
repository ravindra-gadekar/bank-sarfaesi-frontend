import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { caseApi, CaseData } from './api/caseApi';
import { noticeApi, NoticeData } from '../notices/api/noticeApi';

export default function CaseDetailPage() {
  const { caseId: id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [notices, setNotices] = useState<NoticeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [c, n] = await Promise.all([
          caseApi.getById(id),
          noticeApi.listByCase(id),
        ]);
        setCaseData(c);
        setNotices(n);
      } catch {
        navigate('/cases');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Close type menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowTypeMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Determine which notice types already exist for this case
  const hasFinalDemand = notices.some((n) => n.noticeType === 'demand_13_2' && n.status === 'final');
  const hasFinalPossession = notices.some((n) => n.noticeType === 'possession_13_4' && n.status === 'final');

  const noticeTypes = [
    {
      key: 'demand_13_2',
      label: 'Demand Notice — §13(2)',
      desc: '60-day formal demand to borrower',
      enabled: true,
    },
    {
      key: 'possession_13_4',
      label: 'Possession Notice — §13(4)',
      desc: hasFinalDemand ? 'After 60-day period expires' : 'Requires finalized 13(2) notice first',
      enabled: hasFinalDemand,
    },
    {
      key: 'sale_auction',
      label: 'Sale / Auction Notice — Rule 8/9',
      desc: hasFinalPossession ? 'Post-possession asset sale' : 'Requires finalized 13(4) notice first',
      enabled: hasFinalPossession,
    },
  ];

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      final: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      superseded: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || ''}`}>{status}</span>;
  };

  const noticeTypeLabel = (t: string) => {
    const m: Record<string, string> = { demand_13_2: 'Demand 13(2)', possession_13_4: 'Possession 13(4)', sale_auction: 'Sale/Auction' };
    return m[t] || t;
  };

  if (loading) return <div className="text-ink-tertiary dark:text-dark-text-tertiary">Loading...</div>;
  if (!caseData) return null;

  const primary = caseData.borrowers.find((b) => b.type === 'primary');
  const coBorrowers = caseData.borrowers.filter((b) => b.type === 'co-borrower');
  const guarantors = caseData.borrowers.filter((b) => b.type === 'guarantor');

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/cases" className="text-sm text-accent hover:text-accent-hover mb-2 inline-block">&larr; Back to Cases</Link>
          <h2 className="text-2xl font-semibold text-ink dark:text-dark-text tracking-tight">
            Case: {caseData.accountNo}
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/cases/${caseData._id}/edit`)}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-sand-200 dark:bg-dark-surface text-ink dark:text-dark-text hover:bg-sand-300 dark:hover:bg-dark-surface-hover transition-colors"
          >
            Edit Case
          </button>
          <button
            onClick={() => navigate(`/notices/new?caseId=${caseData._id}`)}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-accent text-white hover:bg-accent-hover transition-colors hidden"
          >
            + Create Notice
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowTypeMenu((v) => !v)}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-accent text-white hover:bg-accent-hover transition-colors flex items-center gap-1.5"
            >
              + Create Notice
              <svg className={`w-4 h-4 transition-transform ${showTypeMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showTypeMenu && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border shadow-lg z-50 overflow-hidden">
                <p className="px-4 pt-3 pb-2 text-xs font-medium text-ink-tertiary dark:text-dark-text-tertiary uppercase tracking-wider">Select Notice Type</p>
                {noticeTypes.map((nt) => (
                  <button
                    key={nt.key}
                    disabled={!nt.enabled}
                    onClick={() => {
                      setShowTypeMenu(false);
                      navigate(`/notices/new?caseId=${caseData._id}&type=${nt.key}`);
                    }}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      nt.enabled
                        ? 'hover:bg-sand-100 dark:hover:bg-dark-surface-hover cursor-pointer'
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <p className={`text-sm font-medium ${nt.enabled ? 'text-ink dark:text-dark-text' : 'text-ink-tertiary dark:text-dark-text-tertiary'}`}>
                      {nt.label}
                    </p>
                    <p className="text-xs text-ink-tertiary dark:text-dark-text-tertiary mt-0.5">{nt.desc}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Loan Info */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border p-5">
            <h3 className="font-medium text-ink dark:text-dark-text mb-4">Loan Information</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Account No:</span><br/><span className="font-medium text-ink dark:text-dark-text">{caseData.accountNo}</span></div>
              <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Loan Type:</span><br/><span className="font-medium text-ink dark:text-dark-text">{caseData.loanType}</span></div>
              <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Sanction Date:</span><br/><span className="font-medium text-ink dark:text-dark-text">{formatDate(caseData.sanctionDate)}</span></div>
              <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Sanction Amount:</span><br/><span className="font-medium text-ink dark:text-dark-text">{formatCurrency(caseData.sanctionAmount)}</span></div>
              <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">NPA Date:</span><br/><span className="font-medium text-ink dark:text-dark-text">{formatDate(caseData.npaDate)}</span></div>
              <div><span className="text-ink-tertiary dark:text-dark-text-tertiary">Status:</span><br/><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${caseData.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{caseData.status}</span></div>
            </div>
          </div>

          {/* Borrowers */}
          <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border p-5">
            <h3 className="font-medium text-ink dark:text-dark-text mb-4">Borrowers</h3>
            <div className="space-y-3">
              {primary && (
                <div className="text-sm bg-sand-100 dark:bg-dark-surface-hover rounded-lg p-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent-light text-accent font-medium mr-2">Primary</span>
                  <span className="font-medium text-ink dark:text-dark-text">{primary.name}</span>
                  {primary.pan && <span className="text-ink-tertiary dark:text-dark-text-tertiary ml-2">PAN: {primary.pan}</span>}
                  <p className="text-ink-secondary dark:text-dark-text-secondary mt-1">{primary.address}</p>
                </div>
              )}
              {coBorrowers.map((b, i) => (
                <div key={i} className="text-sm bg-sand-100 dark:bg-dark-surface-hover rounded-lg p-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium mr-2">Co-Borrower</span>
                  <span className="font-medium text-ink dark:text-dark-text">{b.name}</span>
                  <p className="text-ink-secondary dark:text-dark-text-secondary mt-1">{b.address}</p>
                </div>
              ))}
              {guarantors.map((b, i) => (
                <div key={i} className="text-sm bg-sand-100 dark:bg-dark-surface-hover rounded-lg p-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium mr-2">Guarantor</span>
                  <span className="font-medium text-ink dark:text-dark-text">{b.name}</span>
                  <p className="text-ink-secondary dark:text-dark-text-secondary mt-1">{b.address}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Assets */}
          <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border p-5">
            <h3 className="font-medium text-ink dark:text-dark-text mb-4">Secured Assets</h3>
            <div className="space-y-3">
              {caseData.securedAssets.map((a, i) => (
                <div key={i} className="text-sm bg-sand-100 dark:bg-dark-surface-hover rounded-lg p-3">
                  <span className="font-medium text-ink dark:text-dark-text">{a.assetType}</span>
                  <p className="text-ink-secondary dark:text-dark-text-secondary">{a.description}</p>
                  {a.surveyNo && <p className="text-ink-tertiary dark:text-dark-text-tertiary">Survey: {a.surveyNo}</p>}
                  {a.district && <p className="text-ink-tertiary dark:text-dark-text-tertiary">{a.district}, {a.state}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar: Notices */}
        <div>
          <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-ink dark:text-dark-text">Notices</h3>
              <span className="text-xs text-ink-tertiary dark:text-dark-text-tertiary">{notices.length} total</span>
            </div>
            {notices.length === 0 ? (
              <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary">No notices created yet.</p>
            ) : (
              <div className="space-y-2">
                {notices.map((n) => (
                  <div
                    key={n._id}
                    className="text-sm bg-sand-100 dark:bg-dark-surface-hover rounded-lg p-3 hover:bg-sand-200 dark:hover:bg-dark-border transition-colors"
                  >
                    <Link to={`/notices/${n._id}/edit`} className="block">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-ink dark:text-dark-text">{noticeTypeLabel(n.noticeType)}</span>
                        {statusBadge(n.status)}
                      </div>
                      <p className="text-ink-tertiary dark:text-dark-text-tertiary mt-1">{formatDate(n.createdAt)}</p>
                    </Link>
                    {n.status === 'draft' && (
                      <button
                        onClick={async () => {
                          if (!window.confirm('Delete this draft notice?')) return;
                          try {
                            await noticeApi.deleteDraft(n._id);
                            setNotices((prev) => prev.filter((x) => x._id !== n._id));
                          } catch { /* ignore */ }
                        }}
                        className="text-red-600 dark:text-red-400 text-xs mt-1.5 hover:underline"
                      >
                        Delete draft
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
