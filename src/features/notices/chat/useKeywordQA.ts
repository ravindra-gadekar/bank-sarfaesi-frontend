import { useCallback } from 'react';

/**
 * Handles keyword-based Q&A when user types a question instead of a field answer.
 * Returns null if no match found.
 */
export function useKeywordQA(keywordAnswerMap: Record<string, string>) {
  const findAnswer = useCallback((input: string): string | null => {
    const lower = input.toLowerCase();
    for (const [keyword, answer] of Object.entries(keywordAnswerMap)) {
      if (lower.includes(keyword.toLowerCase())) {
        return answer;
      }
    }
    return null;
  }, [keywordAnswerMap]);

  return { findAnswer };
}
