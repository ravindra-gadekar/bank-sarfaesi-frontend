import { useRef, useState } from 'react';
import { useOnboardingStore } from '../../../store/onboardingStore';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export default function LetterheadStep() {
  const { letterheadFile, letterheadPreview, setLetterhead, prevStep, nextStep } = useOnboardingStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const validateAndSet = (file: File) => {
    setError('');
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Only PNG, JPEG, or PDF files are allowed.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File size must be under 2MB.');
      return;
    }

    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    setLetterhead(file, preview);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSet(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSet(file);
  };

  const removeFile = () => {
    if (letterheadPreview) URL.revokeObjectURL(letterheadPreview);
    setLetterhead(null, null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-ink dark:text-dark-text mb-1">Bank Letterhead</h2>
      <p className="text-sm text-ink-secondary dark:text-dark-text-secondary mb-6">
        Upload your bank letterhead for notice generation.{' '}
        <span className="text-ink-tertiary dark:text-dark-text-tertiary">(Optional — can be added later)</span>
      </p>

      {!letterheadFile ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-accent bg-accent/5'
              : 'border-sand-300 hover:border-accent/50 dark:border-dark-border dark:hover:border-accent/50'
          }`}
        >
          <div className="text-3xl mb-2">📄</div>
          <p className="text-sm font-medium text-ink dark:text-dark-text">
            Drop your letterhead here or <span className="text-accent">browse</span>
          </p>
          <p className="text-xs text-ink-tertiary dark:text-dark-text-tertiary mt-1">
            PNG, JPEG, or PDF — Max 2MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="border border-sand-300 dark:border-dark-border rounded-xl p-4">
          {letterheadPreview ? (
            <img
              src={letterheadPreview}
              alt="Letterhead preview"
              className="max-h-40 mx-auto rounded-lg mb-3"
            />
          ) : (
            <div className="flex items-center justify-center gap-2 py-6 mb-3">
              <span className="text-2xl">📎</span>
              <span className="text-ink dark:text-dark-text font-medium">{letterheadFile.name}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-secondary dark:text-dark-text-secondary">
              {letterheadFile.name} ({(letterheadFile.size / 1024).toFixed(0)} KB)
            </span>
            <button onClick={removeFile} className="text-red-500 hover:underline text-sm">
              Remove
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <div className="flex justify-between mt-8 pt-6 border-t border-sand-300 dark:border-dark-border">
        <button
          type="button"
          onClick={prevStep}
          className="px-6 py-2.5 rounded-xl border border-sand-300 text-ink hover:bg-sand-100 dark:border-dark-border dark:text-dark-text dark:hover:bg-dark-bg transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={nextStep}
          className="px-6 py-2.5 rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors font-medium"
        >
          {letterheadFile ? 'Continue' : 'Skip for now'}
        </button>
      </div>
    </div>
  );
}
