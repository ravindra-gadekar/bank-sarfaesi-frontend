import { ReactNode } from 'react';

interface RepeatableSectionProps<T> {
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderItem: (item: T, index: number) => ReactNode;
  addLabel?: string;
  minItems?: number;
  maxItems?: number;
  title?: string;
}

export default function RepeatableSection<T>({
  items,
  onAdd,
  onRemove,
  renderItem,
  addLabel = 'Add another',
  minItems = 0,
  maxItems = 20,
  title,
}: RepeatableSectionProps<T>) {
  return (
    <div className="space-y-4">
      {title && <h4 className="text-sm font-medium text-ink-secondary dark:text-dark-text-secondary">{title}</h4>}
      {items.map((item, index) => (
        <div key={index} className="relative bg-sand-100 dark:bg-dark-surface-hover rounded-xl p-4 border border-sand-300 dark:border-dark-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">{renderItem(item, index)}</div>
            {items.length > minItems && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="mt-1 text-red-500 hover:text-red-600 text-xs font-medium shrink-0"
              >
                Remove
              </button>
            )}
          </div>
          <span className="absolute -top-2.5 left-3 bg-sand-100 dark:bg-dark-surface-hover px-2 text-xs text-ink-tertiary dark:text-dark-text-tertiary">
            #{index + 1}
          </span>
        </div>
      ))}
      {items.length < maxItems && (
        <button
          type="button"
          onClick={onAdd}
          className="text-accent hover:text-accent-hover text-sm font-medium transition-colors"
        >
          + {addLabel}
        </button>
      )}
    </div>
  );
}
