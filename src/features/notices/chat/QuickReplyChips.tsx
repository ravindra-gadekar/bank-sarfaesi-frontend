interface QuickReplyChipsProps {
  options: string[];
  onSelect: (value: string) => void;
}

export default function QuickReplyChips({ options, onSelect }: QuickReplyChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className="px-3 py-1.5 rounded-full border border-accent/40 text-accent text-sm font-medium hover:bg-accent/10 transition-colors"
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
