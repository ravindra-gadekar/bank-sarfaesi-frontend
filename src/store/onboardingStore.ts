import { create } from 'zustand';

interface PersonalDetails {
  name: string;
  designation: string;
  mobile: string;
}

interface BankInfo {
  bankName: string;
  bankType: string;
  rbiRegNo: string;
  hoAddress: string;
  state: string;
  website: string;
}

interface BranchInfo {
  branchName: string;
  branchCode: string;
  ifscCode: string;
  branchAddress: string;
  city: string;
  district: string;
  state: string;
  pinCode: string;
  phone: string;
  email: string;
}

interface DrtJurisdiction {
  name: string;
  location: string;
}

interface OnboardingState {
  currentStep: number;
  personalDetails: PersonalDetails;
  bankInfo: BankInfo;
  branchInfo: BranchInfo;
  drtJurisdiction: DrtJurisdiction;
  letterheadFile: File | null;
  letterheadPreview: string | null;
  branchId: string | null;

  setPersonalDetails: (data: Partial<PersonalDetails>) => void;
  setBankInfo: (data: Partial<BankInfo>) => void;
  setBranchInfo: (data: Partial<BranchInfo>) => void;
  setDrtJurisdiction: (data: DrtJurisdiction) => void;
  setLetterhead: (file: File | null, preview: string | null) => void;
  setBranchId: (id: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  reset: () => void;
}

const MAX_STEP = 6; // 0-6: Personal, BankInfo, BranchInfo, DRT, Letterhead, Review, Complete

const initialState = {
  currentStep: 0,
  personalDetails: { name: '', designation: '', mobile: '' },
  bankInfo: { bankName: '', bankType: '', rbiRegNo: '', hoAddress: '', state: '', website: '' },
  branchInfo: { branchName: '', branchCode: '', ifscCode: '', branchAddress: '', city: '', district: '', state: '', pinCode: '', phone: '', email: '' },
  drtJurisdiction: { name: '', location: '' },
  letterheadFile: null,
  letterheadPreview: null,
  branchId: null,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,

  setPersonalDetails: (data) =>
    set((state) => ({ personalDetails: { ...state.personalDetails, ...data } })),
  setBankInfo: (data) =>
    set((state) => ({ bankInfo: { ...state.bankInfo, ...data } })),
  setBranchInfo: (data) =>
    set((state) => ({ branchInfo: { ...state.branchInfo, ...data } })),
  setDrtJurisdiction: (data) => set({ drtJurisdiction: data }),
  setLetterhead: (file, preview) => set({ letterheadFile: file, letterheadPreview: preview }),
  setBranchId: (id) => set({ branchId: id }),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, MAX_STEP) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),
  goToStep: (step) => set({ currentStep: Math.max(0, Math.min(step, MAX_STEP)) }),
  reset: () => set(initialState),
}));
