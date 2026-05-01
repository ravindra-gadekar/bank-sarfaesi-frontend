export interface QuestionValidation {
  type: 'required' | 'min' | 'max' | 'regex' | 'minLength' | 'maxLength';
  value?: string | number;
  message: string;
}

export interface QuestionNode {
  id: string;
  questionText: string;
  fieldKey: string;
  inputType: 'text' | 'currency' | 'date' | 'number' | 'dropdown' | 'textarea';
  options?: string[];
  validation: QuestionValidation[];
  chatScript: string;
  nextQuestion: string | null;
  conditionalNext?: { value: string; nextId: string }[];
  isLoopStart?: boolean;
  loopBackTo?: string;
  loopPrompt?: string;
  group?: string;
  required?: boolean;
}

export interface ChatFlowConfig {
  _id: string;
  branchId: string | null;
  noticeType: 'demand_13_2' | 'possession_13_4' | 'sale_auction';
  version: number;
  questionFlow: QuestionNode[];
  keywordAnswerMap: Record<string, string>;
  isActive: boolean;
  effectiveFrom: string;
  createdAt: string;
  updatedAt: string;
}

export const NOTICE_TYPE_LABELS: Record<string, string> = {
  demand_13_2: 'Section 13(2) — Demand Notice',
  possession_13_4: 'Section 13(4) — Possession Notice',
  sale_auction: 'Rule 8/9 — Sale / Auction Notice',
};
