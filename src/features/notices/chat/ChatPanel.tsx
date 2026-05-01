import { useRef, useEffect, useState } from 'react';
import { ChatMessage } from './types';
import { QuestionNode } from '../api/noticeApi';
import BotBubble from './BotBubble';
import UserBubble from './UserBubble';
import ChatInput from './ChatInput';
import ChatProgress from './ChatProgress';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentQuestion: QuestionNode | null;
  progress: { filled: number; total: number; percent: number };
  onSubmitAnswer: (answer: string) => void;
  onSkip: () => void;
  onStartOver: () => void;
  onClose?: () => void;
  isOverlay?: boolean;
}

export default function ChatPanel({
  messages,
  currentQuestion,
  progress,
  onSubmitAnswer,
  onSkip,
  onStartOver,
  onClose,
  isOverlay,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!userScrolled && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, userScrolled]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setUserScrolled(scrollHeight - scrollTop - clientHeight > 50);
  };

  return (
    <div className={`flex flex-col bg-sand-50 dark:bg-dark-surface border-l border-sand-300 dark:border-dark-border ${isOverlay ? 'fixed inset-0 z-50' : 'h-full'}`}>
      {/* Header */}
      <div className="shrink-0 border-b border-sand-300 dark:border-dark-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-ink dark:text-dark-text">Notice Assistant</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onStartOver}
              className="text-xs text-ink-tertiary dark:text-dark-text-tertiary hover:text-ink-secondary dark:hover:text-dark-text-secondary"
            >
              Start over
            </button>
            {onClose && (
              <button onClick={onClose} className="text-ink-tertiary dark:text-dark-text-tertiary hover:text-ink dark:hover:text-dark-text text-lg leading-none">&times;</button>
            )}
          </div>
        </div>
        <ChatProgress {...progress} />
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {messages.map((msg) => {
          if (msg.sender === 'bot') return <BotBubble key={msg.id} message={msg} />;
          if (msg.sender === 'user') return <UserBubble key={msg.id} message={msg} />;
          // System messages
          return (
            <div key={msg.id} className="text-center text-xs text-ink-tertiary dark:text-dark-text-tertiary py-1">
              {msg.text}
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="shrink-0">
        <ChatInput
          currentQuestion={currentQuestion}
          onSubmit={onSubmitAnswer}
          onSkip={onSkip}
        />
      </div>
    </div>
  );
}
