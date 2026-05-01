import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatFlowApi } from './api/chatFlowApi';
import type { ChatFlowConfig, QuestionNode } from './types';
import { NOTICE_TYPE_LABELS } from './types';

interface PreviewMessage {
  sender: 'bot' | 'user';
  text: string;
}

export default function ChatFlowPreview() {
  const { configId } = useParams<{ configId: string }>();
  const navigate = useNavigate();

  const [config, setConfig] = useState<ChatFlowConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Chat state
  const [messages, setMessages] = useState<PreviewMessage[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [done, setDone] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConfig = useCallback(async () => {
    if (!configId) return;
    setLoading(true);
    try {
      const { data: resp } = await chatFlowApi.getConfigById(configId);
      setConfig(resp.data);
    } catch {
      setError('Failed to load config.');
    } finally {
      setLoading(false);
    }
  }, [configId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Start chat when config loads
  useEffect(() => {
    if (!config || config.questionFlow.length === 0) return;
    const firstNode = config.questionFlow[0];
    setMessages([{ sender: 'bot', text: formatBotMessage(firstNode) }]);
    setCurrentNodeId(firstNode.id);
    setDone(false);
  }, [config]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const nodeMap = useCallback((): Map<string, QuestionNode> => {
    const map = new Map<string, QuestionNode>();
    config?.questionFlow.forEach((n: QuestionNode) => map.set(n.id, n));
    return map;
  }, [config]);

  const handleSend = () => {
    if (!input.trim() || !currentNodeId || done) return;

    const userText = input.trim();
    setInput('');

    const map = nodeMap();
    const currentNode = map.get(currentNodeId);
    if (!currentNode) return;

    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);

    // Determine next node
    let nextId: string | null = null;

    // Check conditional next first
    if (currentNode.conditionalNext?.length) {
      const match = currentNode.conditionalNext.find(
        (cn: { value: string; nextId: string }) => cn.value.toLowerCase() === userText.toLowerCase(),
      );
      if (match) nextId = match.nextId;
    }

    // Fall back to default nextQuestion
    if (!nextId) nextId = currentNode.nextQuestion;

    if (nextId) {
      const nextNode = map.get(nextId);
      if (nextNode) {
        setCurrentNodeId(nextId);
        setMessages((prev) => [...prev, { sender: 'bot', text: formatBotMessage(nextNode) }]);
      } else {
        setMessages((prev) => [...prev, { sender: 'bot', text: `⚠️ Dangling reference: "${nextId}" not found.` }]);
        setDone(true);
      }
    } else {
      setMessages((prev) => [...prev, { sender: 'bot', text: '✅ End of flow reached. All questions answered!' }]);
      setDone(true);
    }
  };

  const handleRestart = () => {
    if (!config || config.questionFlow.length === 0) return;
    const firstNode = config.questionFlow[0];
    setMessages([{ sender: 'bot', text: formatBotMessage(firstNode) }]);
    setCurrentNodeId(firstNode.id);
    setInput('');
    setDone(false);
  };

  if (loading) {
    return <div className="text-gray-500 dark:text-gray-400 py-10 text-center">Loading...</div>;
  }

  if (!config) {
    return <div className="text-red-500 py-10 text-center">{error || 'Config not found.'}</div>;
  }

  const currentNode = currentNodeId ? nodeMap().get(currentNodeId) : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button onClick={() => navigate('/chat-flows')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-1">
          &larr; Back to Configs
        </button>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Preview — {NOTICE_TYPE_LABELS[config.noticeType] || config.noticeType}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          v{config.version} • {config.questionFlow.length} nodes • Walk through the chat flow without saving
        </p>
      </div>

      {/* Chat panel */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-card flex flex-col" style={{ height: '60vh' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
          {done ? (
            <button
              onClick={handleRestart}
              className="w-full py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              Restart Preview
            </button>
          ) : (
            <div className="flex gap-2">
              {currentNode?.inputType === 'dropdown' && currentNode.options?.length ? (
                <select
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select...</option>
                  {currentNode.options.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={currentNode?.inputType === 'date' ? 'date' : currentNode?.inputType === 'number' || currentNode?.inputType === 'currency' ? 'number' : 'text'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={currentNode ? `Enter ${currentNode.inputType}...` : 'Type...'}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100"
                />
              )}
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatBotMessage(node: QuestionNode): string {
  let text = '';
  if (node.chatScript) text += `${node.chatScript}\n\n`;
  text += node.questionText;
  if (node.inputType === 'dropdown' && node.options?.length) {
    text += `\n\nOptions: ${node.options.join(', ')}`;
  }
  if (node.group) text += `\n[${node.group}]`;
  return text.trim();
}
