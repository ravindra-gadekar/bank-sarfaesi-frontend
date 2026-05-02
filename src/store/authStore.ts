import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserKind = 'app' | 'bank';
export type OfficeType = 'HO' | 'Zonal' | 'Regional' | 'Branch';

interface BranchInfo {
  branchId: string;
  branchName: string;
  bankName: string;
  role: string;
  officeType?: OfficeType;
  bankRootId?: string;
}

export interface OfficeSummary {
  officeId: string;
  bankName: string;
  branchName?: string;
  officeType: OfficeType;
  bankRootId: string;
  role: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  branchId?: string;
  branchName?: string;
  userKind?: UserKind;
  appRole?: 'superadmin' | 'admin' | 'support';
  bankRole?: 'admin' | 'manager' | 'maker' | 'checker' | 'auditor';
  officeId?: string;
  officeType?: OfficeType;
  bankName?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
  branches: BranchInfo[];
  hasBranch: boolean;
  offices: OfficeSummary[];
  hasOffice: boolean;
  selectedOfficeId: string | null;
  user: User | null;

  loginIdentity: (email: string, branches: BranchInfo[]) => void;
  selectBranch: (user: User) => void;
  setBranches: (branches: BranchInfo[]) => void;
  setOffices: (offices: OfficeSummary[]) => void;
  selectOffice: (officeId: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

function branchesToOffices(branches: BranchInfo[]): OfficeSummary[] {
  return branches.map((b) => ({
    officeId: b.branchId,
    bankName: b.bankName,
    branchName: b.branchName,
    officeType: b.officeType ?? 'Branch',
    bankRootId: b.bankRootId ?? b.branchId,
    role: b.role,
  }));
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      email: null,
      branches: [],
      hasBranch: false,
      offices: [],
      hasOffice: false,
      selectedOfficeId: null,
      user: null,

      loginIdentity: (email, branches) =>
        set({
          isAuthenticated: true,
          email,
          branches,
          hasBranch: false,
          offices: branchesToOffices(branches),
          hasOffice: false,
          selectedOfficeId: null,
          user: null,
        }),

      selectBranch: (user) =>
        set({
          hasBranch: true,
          hasOffice: true,
          selectedOfficeId: user.officeId ?? user.branchId ?? null,
          user,
        }),

      setBranches: (branches) =>
        set({ branches, offices: branchesToOffices(branches) }),

      setOffices: (offices) => set({ offices }),

      selectOffice: (officeId, user) =>
        set({
          hasOffice: true,
          hasBranch: true,
          selectedOfficeId: officeId,
          user,
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          email: null,
          branches: [],
          hasBranch: false,
          offices: [],
          hasOffice: false,
          selectedOfficeId: null,
          user: null,
        }),

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
