import { useState } from 'react';

interface MultiDatePickerProps {
  dates: string[];
  onChange: (dates: string[]) => void;
  minDates?: number;
  label?: string;
}

export default function MultiDatePicker({
  dates,
  onChange,
  minDates = 2,
  label = 'Inspection Dates',
}: MultiDatePickerProps) {
  const [newDate, setNewDate] = useState('');

  const addDate = () => {
    if (!newDate) return;
    if (dates.includes(newDate)) return; // prevent duplicates
    const sorted = [...dates, newDate].sort();
    onChange(sorted);
    setNewDate('');
  };

  const removeDate = (index: number) => {
    onChange(dates.filter((_, i) => i !== index));
  };

  const inputCls = 'px-3 py-2 rounded-xl bg-white dark:bg-dark-surface-hover border border-sand-300 dark:border-dark-border text-ink dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-accent/30';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-ink-secondary dark:text-dark-text-secondary">
        {label} * <span className="text-xs font-normal text-ink-tertiary">(min {minDates})</span>
      </label>

      {/* Existing dates */}
      <div className="flex flex-wrap gap-2">
        {dates.map((d, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sand-200 dark:bg-dark-surface text-sm text-ink dark:text-dark-text"
          >
            <span>{new Date(d).toLocaleDateString('en-IN')}</span>
            <button
              type="button"
              onClick={() => removeDate(i)}
              className="text-red-500 hover:text-red-700 text-xs font-bold ml-1"
              title="Remove date"
            >
              ✕
            </button>
          </div>
        ))}
        {dates.length === 0 && (
          <span className="text-xs text-ink-tertiary dark:text-dark-text-tertiary">No dates added yet</span>
        )}
      </div>

      {/* Add new date */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className={inputCls}
        />
        <button
          type="button"
          onClick={addDate}
          disabled={!newDate}
          className="px-3 py-2 rounded-xl text-sm font-medium bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-40"
        >
          + Add
        </button>
      </div>

      {/* Validation hint */}
      {dates.length < minDates && (
        <p className="text-xs text-red-500">
          {dates.length === 0
            ? `At least ${minDates} dates required`
            : `${minDates - dates.length} more date(s) needed`}
        </p>
      )}
    </div>
  );
}
