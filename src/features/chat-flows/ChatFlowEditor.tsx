import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatFlowApi } from './api/chatFlowApi';
import type { ChatFlowConfig, QuestionNode } from './types';
import { NOTICE_TYPE_LABELS } from './types';

const INPUT_TYPES = ['text', 'currency', 'date', 'number', 'dropdown', 'textarea'] as const;

export default function ChatFlowEditor() {
  const { configId } = useParams<{ configId: string }>();
  const navigate = useNavigate();

  const [config, setConfig] = useState<ChatFlowConfig | null>(null);
  const [flow, setFlow] = useState<QuestionNode[]>([]);
  const [keywords, setKeywords] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!configId) return;
    setLoading(true);
    setError('');
    try {
      const { data: resp } = await chatFlowApi.getConfigById(configId);
      setConfig(resp.data);
      setFlow(resp.data.questionFlow);
      setKeywords(resp.data.keywordAnswerMap);
    } catch {
      setError('Failed to load config.');
    } finally {
      setLoading(false);
    }
  }, [configId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    if (!configId) return;
    setSaving(true);
    setError('');
    try {
      await chatFlowApi.updateConfig(configId, {
        questionFlow: flow,
        keywordAnswerMap: keywords,
      });
      navigate('/chat-flows');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save config.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const updateNode = (index: number, patch: Partial<QuestionNode>) => {
    setFlow((prev) => prev.map((n, i) => (i === index ? { ...n, ...patch } : n)));
  };

  const moveNode = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= flow.length) return;
    setFlow((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeNode = (index: number) => {
    if (!window.confirm(`Remove question "${flow[index].id}"?`)) return;
    setFlow((prev) => prev.filter((_, i) => i !== index));
  };

  const addNode = () => {
    const newId = `q_new_${Date.now()}`;
    setFlow((prev) => [
      ...prev,
      {
        id: newId,
        questionText: '',
        fieldKey: '',
        inputType: 'text',
        validation: [],
        chatScript: '',
        nextQuestion: null,
        group: '',
      },
    ]);
    setExpandedNode(newId);
  };

  const addKeyword = () => {
    const key = window.prompt('Enter keyword:');
    if (!key?.trim()) return;
    setKeywords((prev) => ({ ...prev, [key.trim().toLowerCase()]: '' }));
  };

  const removeKeyword = (key: string) => {
    setKeywords((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  if (loading) {
    return <div className="text-gray-500 dark:text-gray-400 py-10 text-center">Loading...</div>;
  }

  if (!config) {
    return <div className="text-red-500 py-10 text-center">{error || 'Config not found.'}</div>;
  }

  const isGlobal = config.branchId === null;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => navigate('/chat-flows')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-1">
            &larr; Back to Configs
          </button>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Edit Chat Flow — {NOTICE_TYPE_LABELS[config.noticeType] || config.noticeType}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Version {config.version} • {config.isActive ? 'Active' : 'Inactive'}
            {isGlobal && ' • Global Default (read-only)'}
          </p>
        </div>
        {!isGlobal && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save as New Version'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Question Flow */}
      <section className="bg-white dark:bg-dark-card rounded-xl shadow-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Question Flow ({flow.length} nodes)
          </h2>
          {!isGlobal && (
            <button
              onClick={addNode}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              + Add Question
            </button>
          )}
        </div>

        <div className="space-y-2">
          {flow.map((node, index) => (
            <div
              key={node.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              {/* Collapsed header */}
              <button
                onClick={() => setExpandedNode(expandedNode === node.id ? null : node.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="text-xs font-mono text-gray-400 w-8">{index + 1}.</span>
                <span className="text-xs font-mono text-blue-600 dark:text-blue-400 w-32 truncate">{node.id}</span>
                <span className="flex-1 text-sm text-gray-900 dark:text-gray-100 truncate">
                  {node.questionText || '(no question text)'}
                </span>
                <span className="text-xs text-gray-400">{node.inputType}</span>
                <span className="text-xs text-gray-400">{node.group || '—'}</span>
                <span className="text-gray-400">{expandedNode === node.id ? '▲' : '▼'}</span>
              </button>

              {/* Expanded editor */}
              {expandedNode === node.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/30">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Node ID" value={node.id} disabled={isGlobal} onChange={(v) => updateNode(index, { id: v })} />
                    <Field label="Field Key" value={node.fieldKey} disabled={isGlobal} onChange={(v) => updateNode(index, { fieldKey: v })} />
                    <Field label="Group" value={node.group || ''} disabled={isGlobal} onChange={(v) => updateNode(index, { group: v })} />
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Input Type</label>
                      <select
                        value={node.inputType}
                        disabled={isGlobal}
                        onChange={(e) => updateNode(index, { inputType: e.target.value as QuestionNode['inputType'] })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100"
                      >
                        {INPUT_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Field label="Question Text" value={node.questionText} disabled={isGlobal} onChange={(v) => updateNode(index, { questionText: v })} multiline />
                  <Field label="Chat Script" value={node.chatScript} disabled={isGlobal} onChange={(v) => updateNode(index, { chatScript: v })} multiline />

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Next Question" value={node.nextQuestion || ''} disabled={isGlobal} onChange={(v) => updateNode(index, { nextQuestion: v || null })} />
                    <Field label="Loop Back To" value={node.loopBackTo || ''} disabled={isGlobal} onChange={(v) => updateNode(index, { loopBackTo: v || undefined })} />
                  </div>

                  {node.inputType === 'dropdown' && (
                    <Field
                      label="Options (comma-separated)"
                      value={(node.options || []).join(', ')}
                      disabled={isGlobal}
                      onChange={(v) => updateNode(index, { options: v.split(',').map((s) => s.trim()).filter(Boolean) })}
                    />
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    <label className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={node.required ?? false}
                        disabled={isGlobal}
                        onChange={(e) => updateNode(index, { required: e.target.checked })}
                      />
                      Required
                    </label>
                    <label className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={node.isLoopStart ?? false}
                        disabled={isGlobal}
                        onChange={(e) => updateNode(index, { isLoopStart: e.target.checked })}
                      />
                      Loop Start
                    </label>
                  </div>

                  {!isGlobal && (
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => moveNode(index, -1)} disabled={index === 0} className="text-xs px-2 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                        ↑ Move Up
                      </button>
                      <button onClick={() => moveNode(index, 1)} disabled={index === flow.length - 1} className="text-xs px-2 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                        ↓ Move Down
                      </button>
                      <button onClick={() => removeNode(index)} className="text-xs px-2 py-1 border rounded text-red-600 border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/30 dark:text-red-400">
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Keyword Answers */}
      <section className="bg-white dark:bg-dark-card rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Keyword Answers ({Object.keys(keywords).length})
          </h2>
          {!isGlobal && (
            <button
              onClick={addKeyword}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              + Add Keyword
            </button>
          )}
        </div>
        <div className="space-y-2">
          {Object.entries(keywords).map(([key, value]) => (
            <div key={key} className="flex items-start gap-3">
              <span className="text-sm font-mono text-blue-600 dark:text-blue-400 min-w-30 pt-1.5">
                {key}
              </span>
              <textarea
                value={value}
                disabled={isGlobal}
                rows={2}
                onChange={(e) => setKeywords((prev) => ({ ...prev, [key]: e.target.value }))}
                className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 resize-y"
              />
              {!isGlobal && (
                <button
                  onClick={() => removeKeyword(key)}
                  className="text-xs text-red-500 hover:underline pt-1.5"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {Object.keys(keywords).length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500">No keyword answers configured.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  multiline?: boolean;
}) {
  const cls = 'w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100';
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      {multiline ? (
        <textarea value={value} disabled={disabled} rows={2} onChange={(e) => onChange(e.target.value)} className={`${cls} resize-y`} />
      ) : (
        <input value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </div>
  );
}
