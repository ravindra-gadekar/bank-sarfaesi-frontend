import apiClient from '../../../lib/apiClient';

export interface BankSummary {
  _id: string;
  bankName: string;
  bankLogoKey?: string;
  city?: string;
  state?: string;
  setupCompleted: boolean;
  createdAt: string;
  officeCount: number;
  userCount: number;
}

export interface OfficeNode {
  _id: string;
  bankName: string;
  branchName?: string;
  officeType: 'HO' | 'Zonal' | 'Regional' | 'Branch';
  parentId: string | null;
  ancestors: string[];
  address: string;
  city?: string;
}

export interface AppUser {
  _id: string;
  name: string;
  email: string;
  appRole: 'superadmin' | 'admin' | 'support';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface AuditFeedEntry {
  _id: string;
  branchId: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  timestamp: string;
  ipAddress?: string;
}

export interface AppStats {
  totalBanks: number;
  totalOffices: number;
  totalAppUsers: number;
  totalBankUsers: number;
  pendingInvites: number;
}

export const appAdminApi = {
  async listBanks(): Promise<BankSummary[]> {
    const { data } = await apiClient.get('/app/banks');
    return data.data;
  },
  async getBankTree(bankRootId: string): Promise<OfficeNode[]> {
    const { data } = await apiClient.get(`/app/banks/${bankRootId}/tree`);
    return data.data;
  },
  async listAppUsers(): Promise<AppUser[]> {
    const { data } = await apiClient.get('/app/users');
    return data.data;
  },
  async listAuditFeed(limit = 100): Promise<AuditFeedEntry[]> {
    const { data } = await apiClient.get('/app/audit', { params: { limit } });
    return data.data;
  },
  async getStats(): Promise<AppStats> {
    const { data } = await apiClient.get('/app/stats');
    return data.data;
  },
};
