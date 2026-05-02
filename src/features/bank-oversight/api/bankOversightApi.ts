import apiClient from '../../../lib/apiClient';

export type OfficeType = 'HO' | 'Zonal' | 'Regional' | 'Branch';

export interface DashboardStats {
  scopeLabel: string;
  officeType: OfficeType;
  totalBranches: number;
  totalOffices: number;
  totalCases: number;
  totalNotices: number;
  totalUsers: number;
}

export interface SubtreeOffice {
  _id: string;
  bankName: string;
  branchName?: string;
  officeType: OfficeType;
  parentId: string | null;
  ancestors: string[];
  address: string;
  city?: string;
}

export interface BranchCase {
  _id: string;
  accountNo: string;
  loanType?: string;
  sanctionAmount?: number;
  status: string;
  npaDate?: string;
  borrowers?: { name: string }[];
  updatedAt: string;
}

export interface BranchNotice {
  _id: string;
  noticeType: string;
  status: string;
  version?: number;
  updatedAt: string;
}

export const bankOversightApi = {
  async getStats(): Promise<DashboardStats> {
    const { data } = await apiClient.get('/bank/dashboard-stats');
    return data.data;
  },
  async listSubtreeOffices(officeType?: OfficeType): Promise<SubtreeOffice[]> {
    const { data } = await apiClient.get('/bank/subtree-offices', {
      params: officeType ? { officeType } : {},
    });
    return data.data;
  },
  async listBranchCases(branchId: string): Promise<BranchCase[]> {
    const { data } = await apiClient.get(`/bank/branches/${branchId}/cases`);
    return data.data;
  },
  async listBranchNotices(branchId: string): Promise<BranchNotice[]> {
    const { data } = await apiClient.get(`/bank/branches/${branchId}/notices`);
    return data.data;
  },
};
