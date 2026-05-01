import { create } from 'zustand';

interface NoticeFieldsState {
  noticeId: string | null;
  caseId: string | null;
  noticeType: string | null;
  noticeFields: Record<string, unknown>;
  caseData: Record<string, unknown> | null;
  setNoticeContext: (noticeId: string, caseId: string, noticeType: string) => void;
  setField: (key: string, value: unknown) => void;
  setFields: (fields: Record<string, unknown>) => void;
  getField: (key: string) => unknown;
  setCaseData: (data: Record<string, unknown>) => void;
  resetFields: () => void;
}

export const useNoticeFieldsStore = create<NoticeFieldsState>((set, get) => ({
  noticeId: null,
  caseId: null,
  noticeType: null,
  noticeFields: {},
  caseData: null,

  setNoticeContext: (noticeId, caseId, noticeType) =>
    set({ noticeId, caseId, noticeType }),

  setField: (key, value) =>
    set((state) => ({
      noticeFields: { ...state.noticeFields, [key]: value },
    })),

  setFields: (fields) =>
    set((state) => ({
      noticeFields: { ...state.noticeFields, ...fields },
    })),

  getField: (key) => get().noticeFields[key],

  setCaseData: (data) => set({ caseData: data }),

  resetFields: () =>
    set({ noticeFields: {}, noticeId: null, caseId: null, noticeType: null, caseData: null }),
}));
