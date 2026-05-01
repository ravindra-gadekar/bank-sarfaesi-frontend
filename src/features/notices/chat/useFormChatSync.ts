import { useEffect, useRef } from 'react';
import { useNoticeFieldsStore } from '@/store/noticeFieldsStore';

/**
 * Subscribes to form-side field changes and calls the callback
 * so the chat can acknowledge them. Debounced per field (1500ms)
 * to avoid firing on every keystroke.
 */
export function useFormChatSync(onFormFieldChange: (key: string, value: unknown) => void) {
  const addListener = useNoticeFieldsStore((s) => s.addFieldChangeListener);
  const removeListener = useNoticeFieldsStore((s) => s.removeFieldChangeListener);
  const callbackRef = useRef(onFormFieldChange);
  callbackRef.current = onFormFieldChange;
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const listener = (key: string, value: unknown, source: 'form' | 'chat') => {
      if (source !== 'form') return;
      // Debounce per field key
      const existing = timersRef.current.get(key);
      if (existing) clearTimeout(existing);
      timersRef.current.set(
        key,
        setTimeout(() => {
          timersRef.current.delete(key);
          callbackRef.current(key, value);
        }, 1500),
      );
    };
    addListener(listener);
    return () => {
      removeListener(listener);
      // Clear all pending timers on unmount
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, [addListener, removeListener]);
}
