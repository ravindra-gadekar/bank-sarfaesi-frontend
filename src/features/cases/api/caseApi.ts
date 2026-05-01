import apiClient from '@/lib/apiClient';

export interface Borrower {
  name: string;
  address: string;
  pan?: string;
  type: 'primary' | 'co-borrower' | 'guarantor';
}

export interface SecuredAsset {
  assetType: string;
  description: string;
  surveyNo?: string;
  area?: string;
  district?: string;
  state?: string;
}

export interface SecurityDocument {
  documentType: string;
  date: string;
}

export interface CaseData {
  _id: string;
  branchId: string;
  accountNo: string;
  loanType: string;
  sanctionDate: string;
  sanctionAmount: number;
  npaDate: string;
  status: 'active' | 'closed' | 'archived';
  borrowers: Borrower[];
  securedAssets: SecuredAsset[];
  securityDocuments: SecurityDocument[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCasePayload {
  accountNo: string;
  loanType: string;
  sanctionDate: string;
  sanctionAmount: number;
  npaDate: string;
  borrowers: Borrower[];
  securedAssets: SecuredAsset[];
  securityDocuments?: SecurityDocument[];
}

export interface CaseListResponse {
  success: boolean;
  data: { cases: CaseData[]; total: number; page: number; limit: number; totalPages: number };
}

export const caseApi = {
  async list(params?: { page?: number; limit?: number; search?: string; status?: string }) {
    const { data: resp } = await apiClient.get<CaseListResponse>('/cases', { params });
    return {
      data: resp.data.cases,
      pagination: {
        page: resp.data.page,
        limit: resp.data.limit,
        total: resp.data.total,
        totalPages: resp.data.totalPages,
      },
    };
  },

  async getById(id: string) {
    const { data } = await apiClient.get<{ success: boolean; data: CaseData }>(`/cases/${id}`);
    return data.data;
  },

  async create(payload: CreateCasePayload) {
    const { data } = await apiClient.post<{ success: boolean; data: CaseData }>('/cases', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<CreateCasePayload>) {
    const { data } = await apiClient.put<{ success: boolean; data: CaseData }>(`/cases/${id}`, payload);
    return data.data;
  },
};
