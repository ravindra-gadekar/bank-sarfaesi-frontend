import { useRef, useCallback } from 'react';
import { ChatMessage } from './types';

/**
 * Records all chat messages for audit.
 * On save/submit, returns the log array.
 */
export function useChatLogger() {
  const logRef = useRef<Array<{ role: string; message: string; fieldKey?: string; timestamp: string }>>([]);

  const recordMessage = useCallback((msg: ChatMessage) => {
    logRef.current.push({
      role: msg.sender,
      message: 'text' in msg ? msg.text : '',
      fieldKey: 'fieldKey' in msg ? msg.fieldKey : undefined,
      timestamp: new Date(msg.timestamp).toISOString(),
    });
  }, []);

  const getLog = useCallback(() => logRef.current, []);

  const clearLog = useCallback(() => { logRef.current = []; }, []);

  return { recordMessage, getLog, clearLog };
}
