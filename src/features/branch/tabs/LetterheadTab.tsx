import { useState, useEffect, useRef } from 'react';
import { branchApi } from '../api/branchApi';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export default function LetterheadTab() {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await branchApi.getBranch();
        if (data.letterheadUrl) setCurrentUrl(data.letterheadUrl);
      } catch {
        // ignore — will show empty state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setMessage({ type: 'error', text: 'Only PNG, JPEG, or PDF files are allowed.' });
      return;
    }
    if (selected.size > MAX_SIZE) {
      setMessage({ type: 'error', text: 'File must be under 2 MB.' });
      return;
    }

    setFile(selected);
    if (selected.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(selected));
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const { data } = await branchApi.uploadLetterhead(file);
      setCurrentUrl(data.letterheadUrl || null);
      setFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = '';
      setMessage({ type: 'success', text: 'Letterhead uploaded successfully.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to upload letterhead.' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="h-48 bg-sand-200 dark:bg-dark-border rounded-xl animate-pulse" />;
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Current letterhead */}
      <div>
        <h4 className="text-sm font-medium text-ink-secondary dark:text-dark-text-secondary mb-2">
          Current Letterhead
        </h4>
        {currentUrl ? (
          <img
            src={currentUrl}
            alt="Branch letterhead"
            className="max-h-40 rounded-xl border border-sand-300 dark:border-dark-border"
          />
        ) : (
          <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary">
            No letterhead uploaded yet.
          </p>
        )}
      </div>

      {/* Upload */}
      <div>
        <h4 className="text-sm font-medium text-ink-secondary dark:text-dark-text-secondary mb-2">
          Upload New Letterhead
        </h4>
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.pdf"
          onChange={handleFileChange}
          className="block text-sm text-ink-secondary file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-accent file:text-white hover:file:bg-accent-hover dark:text-dark-text-secondary"
        />
        <p className="text-xs text-ink-tertiary dark:text-dark-text-tertiary mt-1">
          PNG, JPEG, or PDF — max 2 MB
        </p>
      </div>

      {/* Preview */}
      {preview && (
        <div>
          <h4 className="text-sm font-medium text-ink-secondary dark:text-dark-text-secondary mb-2">
            Preview
          </h4>
          <img
            src={preview}
            alt="Letterhead preview"
            className="max-h-40 rounded-xl border border-sand-300 dark:border-dark-border"
          />
        </div>
      )}
      {file && !preview && (
        <p className="text-sm text-ink-secondary dark:text-dark-text-secondary">
          Selected: {file.name} (PDF — no preview)
        </p>
      )}

      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {message.text}
        </p>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="bg-accent text-white py-2.5 px-4 rounded-xl font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
}
