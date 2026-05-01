import { useEffect, useRef, useState } from 'react';
import { useNoticeFieldsStore } from '@/store/noticeFieldsStore';
import { noticeApi } from '../api/noticeApi';

export function useAutoSave() {
  const noticeId = useNoticeFieldsStore((s) => s.noticeId);
  const noticeFields = useNoticeFieldsStore((s) => s.noticeFields);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevFieldsRef = useRef<string>('');

  useEffect(() => {
    if (!noticeId) return;

    const currentJson = JSON.stringify(noticeFields);
    if (currentJson === prevFieldsRef.current) return;

    // Debounce 5 seconds
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await noticeApi.updateFields(noticeId, noticeFields);
        prevFieldsRef.current = currentJson;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('error');
      }
    }, 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [noticeId, noticeFields]);

  return saveStatus;
}
