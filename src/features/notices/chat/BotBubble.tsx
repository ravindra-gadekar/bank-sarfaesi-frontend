import { BotMessage } from './types';

const variantStyles: Record<string, string> = {
  question: 'bg-accent/10 dark:bg-accent/20 border-accent/20',
  guidance: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  computed: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  validation: 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800',
  summary: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  acknowledgement: 'bg-sand-100 dark:bg-dark-surface-hover border-sand-300 dark:border-dark-border',
};

const iconMap: Record<string, string> = {
  guidance: '\uD83D\uDCA1',
  computed: '\u26A1',
  validation: '\u26A0\uFE0F',
  summary: '\u2705',
};

export default function BotBubble({ message }: { message: BotMessage }) {
  const style = variantStyles[message.type] || variantStyles.question;
  const icon = iconMap[message.type];

  return (
    <div className="flex gap-2 items-start max-w-[85%]">
      <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs shrink-0 mt-0.5">
        <span className="text-accent font-bold">N</span>
      </div>
      <div className={`rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm border ${style}`}>
        <div className="text-ink dark:text-dark-text leading-relaxed">
          {icon && <span className="mr-1">{icon}</span>}
          {message.text}
        </div>
      </div>
    </div>
  );
}
