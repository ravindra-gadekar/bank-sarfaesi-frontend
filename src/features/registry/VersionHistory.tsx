import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { noticeApi, NoticeData } from '../notices/api/noticeApi';

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
  superseded: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

export default function VersionHistory() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const noticeId = searchParams.get('noticeId');

  const [versions, setVersions] = useState<NoticeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPair, setSelectedPair] = useState<[string, string] | null>(null);

  const fetchVersions = useCallback(async () => {
    if (!noticeId) {
      setError('No noticeId provided.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const chain = await noticeApi.getVersionChain(noticeId);
      setVersions(chain);
      // Auto-select last two for comparison if there are 2+
      if (chain.length >= 2) {
        setSelectedPair([chain[chain.length - 2]._id, chain[chain.length - 1]._id]);
      }
    } catch {
      setError('Failed to load version history.');
    } finally {
      setLoading(false);
    }
  }, [noticeId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleCompare = () => {
    if (!selectedPair) return;
    navigate(`/registry/compare?left=${selectedPair[0]}&right=${selectedPair[1]}`);
  };

  if (loading) {
    return (
      <div className="space-y-3 max-w-4xl mx-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-sand-200 dark:bg-dark-surface-hover rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  const currentNotice = versions.find((v) => v._id === noticeId);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/registry" className="text-sm text-accent hover:underline mb-1 inline-block">
          &larr; Back to Registry
        </Link>
        <h2 className="text-2xl font-semibold text-ink dark:text-dark-text tracking-tight">
          Version History
        </h2>
        {currentNotice && (
          <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary mt-1">
            {NOTICE_TYPE_LABELS[currentNotice.noticeType] || currentNotice.noticeType} &middot;{' '}
            {versions.length} version{versions.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-sand-300 dark:bg-dark-border" />

        <div className="space-y-4">
          {versions.map((v, index) => {
            const isSelected = selectedPair?.includes(v._id);
            return (
              <div
                key={v._id}
                className={`relative pl-14 ${
                  isSelected ? 'bg-accent/5 dark:bg-accent/10 rounded-2xl' : ''
                }`}
              >
                {/* Timeline dot */}
                <div
                  className={`absolute left-4 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                    v.status === 'final'
                      ? 'bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900/50 dark:border-purple-400 dark:text-purple-300'
                      : v.status === 'superseded'
                        ? 'bg-gray-100 border-gray-400 text-gray-500 dark:bg-gray-800 dark:border-gray-600'
                        : 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/50 dark:border-blue-400 dark:text-blue-300'
                  }`}
                >
                  {v.version}
                </div>

                {/* Card */}
                <div className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-ink dark:text-dark-text">
                        Version {v.version}
                      </span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[v.status] || ''}`}>
                        {v.status}
                      </span>
                      {index === versions.length - 1 && v.status !== 'superseded' && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                          Latest
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Compare checkbox */}
                      {versions.length >= 2 && (
                        <label className="flex items-center gap-1.5 text-xs text-ink-secondary dark:text-dark-text-secondary cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected ?? false}
                            onChange={() => {
                              setSelectedPair((prev) => {
                                if (!prev) return [v._id, v._id];
                                if (prev.includes(v._id)) {
                                  // Deselect
                                  const other = prev.filter((id) => id !== v._id);
                                  return other.length > 0 ? [other[0], other[0]] : null;
                                }
                                // Select — replace the older selection
                                return [prev[1], v._id];
                              });
                            }}
                          />
                          Compare
                        </label>
                      )}
                      {/* View action */}
                      {v.status === 'draft' || v.status === 'rejected' ? (
                        <Link to={`/notices/${v._id}/edit`} className="text-xs text-accent font-medium hover:underline">
                          Edit
                        </Link>
                      ) : (
                        <Link to={`/notices/${v._id}/review`} className="text-xs text-accent font-medium hover:underline">
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-ink-tertiary dark:text-dark-text-tertiary">
                    <span>Created: {new Date(v.createdAt).toLocaleString('en-IN')}</span>
                    {v.approvedAt && <span className="ml-4">Approved: {new Date(v.approvedAt).toLocaleString('en-IN')}</span>}
                    {v.supersedes && <span className="ml-4">Supersedes previous version</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compare button */}
      {selectedPair && selectedPair[0] !== selectedPair[1] && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleCompare}
            className="px-6 py-2 bg-accent text-white rounded-xl font-medium text-sm hover:bg-accent/90 transition-colors"
          >
            Compare Selected Versions
          </button>
        </div>
      )}
    </div>
  );
}
