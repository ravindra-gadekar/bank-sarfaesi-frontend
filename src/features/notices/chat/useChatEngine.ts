import { useState, useCallback, useEffect, useRef } from 'react';
import { ChatMessage, BotMessage, UserMessage } from './types';
import { QuestionNode } from '../api/noticeApi';
import { useNoticeFieldsStore } from '@/store/noticeFieldsStore';

interface UseChatEngineOpts {
  questionFlow: QuestionNode[];
  keywordAnswerMap: Record<string, string>;
}

let msgId = 0;
const nextId = () => `msg_${++msgId}`;

export function useChatEngine({ questionFlow, keywordAnswerMap }: UseChatEngineOpts) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const flowMapRef = useRef<Map<string, QuestionNode>>(new Map());
  const { noticeFields, setFieldFromChat, caseData } = useNoticeFieldsStore();

  // Build lookup map
  useEffect(() => {
    const m = new Map<string, QuestionNode>();
    questionFlow.forEach((q) => m.set(q.id, q));
    flowMapRef.current = m;
  }, [questionFlow]);

  const getCurrentQuestion = useCallback((): QuestionNode | null => {
    if (!currentQuestionId) return null;
    return flowMapRef.current.get(currentQuestionId) ?? null;
  }, [currentQuestionId]);

  const addBotMessage = useCallback((text: string, type: BotMessage['type'] = 'question', fieldKey?: string) => {
    const msg: BotMessage = { id: nextId(), sender: 'bot', type, text, fieldKey, timestamp: Date.now() };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const addUserMessage = useCallback((text: string, fieldKey?: string, value?: unknown) => {
    const msg: UserMessage = { id: nextId(), sender: 'user', text, fieldKey, value, timestamp: Date.now() };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const formatINR = (amt: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amt);

  const formatDateShort = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Replace template variables in question text
  const interpolate = useCallback((text: string): string => {
    return text.replace(/\{(\w+)\}/g, (_, key) => {
      if (key === 'borrowerName') {
        const borrowers = caseData?.borrowers as Array<{ name: string; type: string }> | undefined;
        const primary = borrowers?.find((b) => b.type === 'primary');
        return primary?.name || '[Borrower Name]';
      }
      if (key === 'borrowerAddress') {
        const borrowers = caseData?.borrowers as Array<{ address: string; type: string }> | undefined;
        const primary = borrowers?.find((b) => b.type === 'primary');
        return primary?.address || '[Address]';
      }
      if (key === 'totalAmountDemanded') {
        const p = Number(noticeFields.outstandingPrincipal ?? 0);
        const i = Number(noticeFields.outstandingInterest ?? 0);
        const o = Number(noticeFields.otherCharges ?? 0);
        return formatINR(p + i + o);
      }
      if (key === 'assetList') {
        const assets = caseData?.securedAssets as Array<{ assetType: string; description: string }> | undefined;
        if (!assets?.length) return '[No assets]';
        return assets.map((a) => `${a.assetType}: ${a.description}`).join('; ');
      }
      // 13(4) template variables
      if (key === 'refDemandNoticeDate') {
        const d = noticeFields.refDemandNoticeDate as string | undefined;
        return d ? formatDateShort(d) : '[Demand Notice Date]';
      }
      if (key === 'refDemandAmountDemanded') {
        const amt = Number(noticeFields.refDemandAmountDemanded ?? 0);
        return amt > 0 ? formatINR(amt) : '[Amount]';
      }
      if (key === 'section17Deadline') {
        const d = noticeFields.section17Deadline as string | undefined;
        return d ? formatDateShort(d) : '[Auto-computed]';
      }
      // Sale/Auction template variables
      if (key === 'refPossessionDate') {
        const d = noticeFields.refPossessionDate as string | undefined;
        return d ? formatDateShort(d) : '[Possession Date]';
      }
      const val = noticeFields[key];
      return val != null ? String(val) : `[${key}]`;
    });
  }, [noticeFields, caseData]);

  // Find the first question whose field is not yet filled
  const findFirstUnfilledQuestion = useCallback((): QuestionNode | null => {
    const fields = useNoticeFieldsStore.getState().noticeFields;
    for (const q of questionFlow) {
      if (!q.fieldKey) continue; // confirmation/review questions — don't skip
      const val = fields[q.fieldKey];
      if (val === undefined || val === null || val === '') return q;
    }
    // All fields filled — return last question (review)
    return questionFlow[questionFlow.length - 1] ?? null;
  }, [questionFlow]);

  // Start the chat, skipping already-filled questions
  const startChat = useCallback(() => {
    if (questionFlow.length === 0) return;
    setMessages([]);

    const noticeTypeName: Record<string, string> = {
      demand_13_2: 'Demand Notice (Section 13(2))',
      possession_13_4: 'Possession Notice (Section 13(4))',
      sale_auction: 'Sale/Auction Notice (Rule 8/9)',
    };
    const nt = useNoticeFieldsStore.getState().noticeType ?? 'demand_13_2';
    const label = noticeTypeName[nt] || 'notice';
    addBotMessage(`Welcome! I'll help you fill out this ${label} step by step. Let's begin.`, 'guidance');

    const firstUnfilled = findFirstUnfilledQuestion();
    const target = firstUnfilled ?? questionFlow[0];

    // Summarize pre-filled fields
    const fields = useNoticeFieldsStore.getState().noticeFields;
    const skipped = questionFlow.filter(
      (q) => q.fieldKey && fields[q.fieldKey] != null && fields[q.fieldKey] !== '' && q.id !== target.id,
    );
    if (skipped.length > 0) {
      addBotMessage(
        `I see ${skipped.length} field(s) already filled from the form. Jumping to the next empty field.`,
        'acknowledgement',
      );
    }

    setCurrentQuestionId(target.id);
    if (target.chatScript) {
      addBotMessage(target.chatScript, 'guidance');
    }
    addBotMessage(interpolate(target.questionText), 'question', target.fieldKey);
  }, [questionFlow, addBotMessage, interpolate, findFirstUnfilledQuestion]);

  // Move to the next question, auto-skipping already-filled fields
  const advanceToQuestion = useCallback((questionId: string | null) => {
    if (!questionId) {
      addBotMessage('All fields have been covered! You can review and submit the notice.', 'summary');
      setCurrentQuestionId(null);
      return;
    }

    // Walk the chain, skipping questions whose data-entry fields are already filled
    const fields = useNoticeFieldsStore.getState().noticeFields;
    let targetId: string | null = questionId;
    let skippedCount = 0;
    while (targetId) {
      const candidate = flowMapRef.current.get(targetId);
      if (!candidate) break;
      // Questions without a fieldKey (confirmation / review) are never skipped
      if (!candidate.fieldKey) break;
      const val = fields[candidate.fieldKey];
      if (val === undefined || val === null || val === '') break; // not filled — ask it
      // Field is filled — skip
      skippedCount++;
      targetId = candidate.nextQuestion;
    }

    if (!targetId) {
      if (skippedCount > 0) addBotMessage(`Skipped ${skippedCount} already-filled field(s).`, 'acknowledgement');
      addBotMessage('All fields have been covered! You can review and submit the notice.', 'summary');
      setCurrentQuestionId(null);
      return;
    }

    const q = flowMapRef.current.get(targetId);
    if (!q) return;
    if (skippedCount > 0) addBotMessage(`Skipped ${skippedCount} already-filled field(s).`, 'acknowledgement');
    setCurrentQuestionId(targetId);
    if (q.chatScript) {
      addBotMessage(q.chatScript, 'guidance');
    }
    addBotMessage(interpolate(q.questionText), 'question', q.fieldKey);
  }, [addBotMessage, interpolate]);

  // Validate an answer against the question's rules
  const validateAnswer = useCallback((q: QuestionNode, value: string): string | null => {
    for (const rule of q.validation) {
      if (rule.type === 'required' && (!value || value.trim() === '')) return rule.message;
      if (rule.type === 'min' && Number(value) < Number(rule.value)) return rule.message;
      if (rule.type === 'max' && Number(value) > Number(rule.value)) return rule.message;
      if (rule.type === 'minLength' && value.length < Number(rule.value)) return rule.message;
      if (rule.type === 'maxLength' && value.length > Number(rule.value)) return rule.message;
      if (rule.type === 'regex' && !new RegExp(String(rule.value)).test(value)) return rule.message;
    }
    return null;
  }, []);

  // Process a user's answer to the current question
  const submitAnswer = useCallback((answer: string) => {
    const q = getCurrentQuestion();
    if (!q) return;

    // Ignore obvious acknowledgment words that are not meaningful answers for non-dropdown inputs
    const ackWords = ['yes', 'ok', 'okay', 'sure', 'got it', 'correct', 'right', 'fine', 'noted', 'hmm', 'no'];
    if (q.inputType !== 'dropdown' && ackWords.includes(answer.toLowerCase().trim())) {
      addUserMessage(answer);
      addBotMessage('Please answer the question above.', 'guidance');
      addBotMessage(interpolate(q.questionText), 'question', q.fieldKey);
      return;
    }

    // Check if it's a keyword question
    if (answer.includes('?') || answer.length > 100) {
      const lowerAnswer = answer.toLowerCase();
      for (const [keyword, response] of Object.entries(keywordAnswerMap)) {
        if (lowerAnswer.includes(keyword.toLowerCase())) {
          addUserMessage(answer);
          addBotMessage(response, 'guidance');
          // Re-ask the current question
          addBotMessage(interpolate(q.questionText), 'question', q.fieldKey);
          return;
        }
      }
    }

    // Validate
    const validationError = validateAnswer(q, answer);
    if (validationError) {
      addUserMessage(answer);
      addBotMessage(validationError, 'validation');
      addBotMessage(interpolate(q.questionText), 'question', q.fieldKey);
      return;
    }

    addUserMessage(answer, q.fieldKey, answer);

    // Write to store
    if (q.fieldKey) {
      let parsedValue: unknown = answer;
      if (q.inputType === 'currency' || q.inputType === 'number') {
        parsedValue = parseFloat(answer.replace(/[^0-9.-]/g, '')) || 0;
      }
      setFieldFromChat(q.fieldKey, parsedValue);
    }

    // Determine next question
    let nextId: string | null = q.nextQuestion;
    if (q.conditionalNext?.length) {
      const match = q.conditionalNext.find((c) => c.value === answer);
      if (match) nextId = match.nextId || null;
    }

    advanceToQuestion(nextId);
  }, [getCurrentQuestion, keywordAnswerMap, addUserMessage, addBotMessage, setFieldFromChat, validateAnswer, advanceToQuestion, interpolate]);

  // Skip the current question
  const skipQuestion = useCallback(() => {
    const q = getCurrentQuestion();
    if (!q) return;
    if (q.required) {
      addBotMessage('This field is required and cannot be skipped.', 'validation');
      return;
    }
    addBotMessage('Skipped.', 'acknowledgement');
    advanceToQuestion(q.nextQuestion);
  }, [getCurrentQuestion, addBotMessage, advanceToQuestion]);

  // Calculate progress
  const getProgress = useCallback((): { filled: number; total: number; percent: number } => {
    const mandatoryFields = questionFlow.filter((q) => q.required && q.fieldKey);
    const filled = mandatoryFields.filter((q) => {
      const val = noticeFields[q.fieldKey];
      return val !== undefined && val !== null && val !== '';
    }).length;
    const total = mandatoryFields.length;
    return { filled, total, percent: total > 0 ? Math.round((filled / total) * 100) : 0 };
  }, [questionFlow, noticeFields]);

  // Acknowledge a form-side field change in chat
  const acknowledgeFieldChange = useCallback((fieldKey: string, value: unknown) => {
    const q = questionFlow.find((n) => n.fieldKey === fieldKey);
    // Only acknowledge fields that are part of the question flow
    if (!q) return;

    const isEmpty = value === undefined || value === null || value === '';

    // If the current question's field was cleared, navigate back to it
    if (isEmpty && currentQuestionId && q.id === currentQuestionId) {
      return; // User is editing the current field — no action needed, question already shown
    }
    if (isEmpty) {
      // A past field was cleared — jump back to re-ask it
      addBotMessage(`The field "${(q.questionText?.replace(/[?*]/g, '') || fieldKey).trim()}" was cleared. Let's fill it in.`, 'guidance');
      setCurrentQuestionId(q.id);
      if (q.chatScript) addBotMessage(q.chatScript, 'guidance');
      addBotMessage(interpolate(q.questionText), 'question', q.fieldKey);
      return;
    }

    // Only show acknowledgment + advance if this is the current question
    if (currentQuestionId && q.id === currentQuestionId) {
      const fieldLabel = q.questionText?.replace(/[?*]/g, '') || fieldKey;
      const displayValue = typeof value === 'number'
        ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
        : String(value);
      addBotMessage(`Got it — ${fieldLabel.trim()}: ${displayValue}`, 'acknowledgement', fieldKey);
      advanceToQuestion(q.nextQuestion ?? null);
    }
    // Silently ignore form edits to fields that are not the current question
  }, [questionFlow, currentQuestionId, addBotMessage, advanceToQuestion, interpolate]);

  // Reset chat
  const resetChat = useCallback(() => {
    setMessages([]);
    setCurrentQuestionId(null);
  }, []);

  return {
    messages,
    currentQuestion: getCurrentQuestion(),
    currentQuestionId,
    startChat,
    submitAnswer,
    skipQuestion,
    getProgress,
    acknowledgeFieldChange,
    resetChat,
    addBotMessage,
  };
}
