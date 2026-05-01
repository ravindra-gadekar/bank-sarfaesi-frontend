import { useState, KeyboardEvent } from 'react';
import { QuestionNode } from '../api/noticeApi';
import QuickReplyChips from './QuickReplyChips';

interface ChatInputProps {
  currentQuestion: QuestionNode | null;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
  disabled?: boolean;
}

export default function ChatInput({ currentQuestion, onSubmit, onSkip, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (!value.trim() && currentQuestion?.inputType !== 'dropdown') return;
    onSubmit(value.trim());
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!currentQuestion) {
    return (
      <div className="px-4 py-3 bg-sand-100 dark:bg-dark-surface border-t border-sand-300 dark:border-dark-border">
        <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary text-center">All questions answered. Review the form and submit.</p>
      </div>
    );
  }

  // Dropdown → quick reply chips
  if (currentQuestion.inputType === 'dropdown' && currentQuestion.options?.length) {
    return (
      <div className="border-t border-sand-300 dark:border-dark-border bg-sand-50 dark:bg-dark-surface">
        <QuickReplyChips options={currentQuestion.options} onSelect={onSubmit} />
      </div>
    );
  }

  const inputType = currentQuestion.inputType;

  return (
    <div className="px-4 py-3 bg-sand-50 dark:bg-dark-surface border-t border-sand-300 dark:border-dark-border">
      <div className="flex gap-2">
        {inputType === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer..."
            disabled={disabled}
            rows={2}
            className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-dark-surface-hover border border-sand-300 dark:border-dark-border text-sm text-ink dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
          />
        ) : inputType === 'date' ? (
          <input
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-dark-surface-hover border border-sand-300 dark:border-dark-border text-sm text-ink dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        ) : inputType === 'currency' || inputType === 'number' ? (
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={inputType === 'currency' ? 'Enter amount in ₹' : 'Enter number'}
            disabled={disabled}
            className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-dark-surface-hover border border-sand-300 dark:border-dark-border text-sm text-ink dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer..."
            disabled={disabled}
            className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-dark-surface-hover border border-sand-300 dark:border-dark-border text-sm text-ink dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        )}
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40"
        >
          Send
        </button>
      </div>
      {!currentQuestion.required && (
        <button
          onClick={onSkip}
          className="mt-1 text-xs text-ink-tertiary dark:text-dark-text-tertiary hover:text-ink-secondary dark:hover:text-dark-text-secondary"
        >
          Skip this question
        </button>
      )}
    </div>
  );
}
