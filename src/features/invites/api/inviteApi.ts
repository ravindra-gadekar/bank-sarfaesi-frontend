import apiClient from '../../../lib/apiClient';

export interface BankRegistryEntry {
  name: string;
  logoKey: string;
}

export type AppRole = 'superadmin' | 'admin' | 'support';
export type BankRole = 'admin' | 'manager' | 'maker' | 'checker' | 'auditor';
export type OfficeType = 'HO' | 'Zonal' | 'Regional' | 'Branch';

export interface CreateBankInvitePayload {
  email: string;
  bankRole: BankRole;
  targetOfficeId?: string;
  newOffice?: {
    bankName: string;
    bankLogoKey?: string;
    officeType: OfficeType;
    parentOfficeId?: string;
    address: string;
    contact: string;
    email: string;
  };
}

export interface ValidateInviteResponse {
  email: string;
  userKind: 'app' | 'bank';
  bankRole: BankRole | null;
  appRole: AppRole | null;
  bankName: string | null;
  officeType: OfficeType | null;
}

export const inviteApi = {
  async getBankRegistry(): Promise<BankRegistryEntry[]> {
    const { data } = await apiClient.get('/banks/registry');
    return data.data;
  },
  async createAppInvite(email: string, appRole: AppRole) {
    const { data } = await apiClient.post('/invites/app', { email, appRole });
    return data.data;
  },
  async createBankInvite(payload: CreateBankInvitePayload) {
    const { data } = await apiClient.post('/invites/bank', payload);
    return data.data;
  },
  async validateInvite(token: string): Promise<ValidateInviteResponse> {
    const { data } = await apiClient.get(`/invites/${token}/validate`);
    return data.data;
  },
  async acceptInvite(
    token: string,
    payload: { name: string; designation?: string; mobile?: string },
  ) {
    const { data } = await apiClient.post(`/invites/${token}/accept`, payload);
    return data.data;
  },
};
