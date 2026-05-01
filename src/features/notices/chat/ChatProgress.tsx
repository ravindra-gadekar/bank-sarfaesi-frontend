export default function ChatProgress({ filled, total, percent }: { filled: number; total: number; percent: number }) {
  return (
    <div className="px-4 py-2">
      <div className="flex items-center justify-between text-xs text-ink-tertiary dark:text-dark-text-tertiary mb-1">
        <span>{filled} of {total} fields completed</span>
        <span>{percent}%</span>
      </div>
      <div className="w-full h-1.5 bg-sand-200 dark:bg-dark-border rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
