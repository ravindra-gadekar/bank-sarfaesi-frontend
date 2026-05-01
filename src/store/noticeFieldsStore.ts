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
  /** Listeners for field changes — used by chat sync */
  fieldChangeListeners: Array<(key: string, value: unknown, source: 'form' | 'chat') => void>;
  addFieldChangeListener: (listener: (key: string, value: unknown, source: 'form' | 'chat') => void) => void;
  removeFieldChangeListener: (listener: (key: string, value: unknown, source: 'form' | 'chat') => void) => void;
  setFieldFromForm: (key: string, value: unknown) => void;
  setFieldFromChat: (key: string, value: unknown) => void;
}

export const useNoticeFieldsStore = create<NoticeFieldsState>((set, get) => ({
  noticeId: null,
  caseId: null,
  noticeType: null,
  noticeFields: {},
  caseData: null,
  fieldChangeListeners: [],

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

  resetFields: () => set({ noticeFields: {}, noticeId: null, caseId: null, noticeType: null, caseData: null }),

  addFieldChangeListener: (listener) =>
    set((state) => ({ fieldChangeListeners: [...state.fieldChangeListeners, listener] })),

  removeFieldChangeListener: (listener) =>
    set((state) => ({ fieldChangeListeners: state.fieldChangeListeners.filter((l) => l !== listener) })),

  setFieldFromForm: (key, value) => {
    set((state) => ({ noticeFields: { ...state.noticeFields, [key]: value } }));
    get().fieldChangeListeners.forEach((l) => l(key, value, 'form'));
  },

  setFieldFromChat: (key, value) => {
    set((state) => ({ noticeFields: { ...state.noticeFields, [key]: value } }));
    get().fieldChangeListeners.forEach((l) => l(key, value, 'chat'));
  },
}));
