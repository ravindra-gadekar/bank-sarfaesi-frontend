import { useEffect, useRef } from 'react';
import { QuestionNode } from '../api/noticeApi';

/**
 * Listens for form field focus events and pushes contextual help
 * (chatScript) to the chat when a field is focused.
 */
export function useContextualHelp(
  questionFlow: QuestionNode[],
  addGuidanceMessage: (text: string) => void,
) {
  const lastFieldRef = useRef<string | null>(null);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const fieldKey = target.getAttribute('data-field-key');
      if (!fieldKey || fieldKey === lastFieldRef.current) return;
      lastFieldRef.current = fieldKey;

      const question = questionFlow.find((q) => q.fieldKey === fieldKey);
      if (question?.chatScript) {
        addGuidanceMessage(question.chatScript);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, [questionFlow, addGuidanceMessage]);
}
