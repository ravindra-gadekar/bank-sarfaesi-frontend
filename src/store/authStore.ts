import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface BranchInfo {
  branchId: string;
  branchName: string;
  bankName: string;
  role: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  branchId: string;
  branchName: string;
}

interface AuthState {
  /** True after OTP verify — email is confirmed */
  isAuthenticated: boolean;
  /** The verified email */
  email: string | null;
  /** Branches the user belongs to (populated after OTP verify) */
  branches: BranchInfo[];
  /** True after user selects a branch */
  hasBranch: boolean;
  /** Full user object — populated after branch selection */
  user: User | null;

  /** Called after OTP verify — sets email + branches */
  loginIdentity: (email: string, branches: BranchInfo[]) => void;
  /** Called after branch selection — sets full user context */
  selectBranch: (user: User) => void;
  /** Update the branches list (e.g. after creating a new branch) */
  setBranches: (branches: BranchInfo[]) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      email: null,
      branches: [],
      hasBranch: false,
      user: null,

      loginIdentity: (email, branches) =>
        set({ isAuthenticated: true, email, branches, hasBranch: false, user: null }),

      selectBranch: (user) =>
        set({ hasBranch: true, user }),

      setBranches: (branches) =>
        set({ branches }),

      logout: () =>
        set({ isAuthenticated: false, email: null, branches: [], hasBranch: false, user: null }),

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
