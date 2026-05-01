import apiClient from '@/lib/apiClient';

export interface NoticeData {
  _id: string;
  branchId: string;
  caseId: string;
  noticeType: 'demand_13_2' | 'possession_13_4' | 'sale_auction';
  version: number;
  status: 'draft' | 'submitted' | 'rejected' | 'approved' | 'final' | 'superseded';
  fields: Record<string, unknown>;
  recipients: Array<{ name: string; address: string; type: string }>;
  generatedDocs: Array<{ format: string; fileKey: string; sha256: string; recipientName: string; generatedAt: string }>;
  makerUserId: string;
  checkerUserId?: string;
  checkerComment?: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  finalizedAt?: string;
  supersedes?: string;
  createdAt: string;
  updatedAt: string;
}

export const noticeApi = {
  async createDraft(caseId: string, noticeType: string) {
    const { data } = await apiClient.post<{ success: boolean; data: NoticeData }>('/notices', { caseId, noticeType });
    return data.data;
  },

  async deleteDraft(noticeId: string) {
    await apiClient.delete(`/notices/${noticeId}`);
  },

  async updateFields(noticeId: string, fields: Record<string, unknown>) {
    const { data } = await apiClient.put<{ success: boolean; data: NoticeData }>(`/notices/${noticeId}/fields`, { fields });
    return data.data;
  },

  async submit(noticeId: string) {
    const { data } = await apiClient.post<{ success: boolean; data: NoticeData }>(`/notices/${noticeId}/submit`);
    return data.data;
  },

  async approve(noticeId: string, comment?: string) {
    const { data } = await apiClient.post<{ success: boolean; data: NoticeData }>(`/notices/${noticeId}/approve`, { comment });
    return data.data;
  },

  async reject(noticeId: string, comment: string) {
    const { data } = await apiClient.post<{ success: boolean; data: NoticeData }>(`/notices/${noticeId}/reject`, { comment });
    return data.data;
  },

  async listByCase(caseId: string) {
    const { data } = await apiClient.get<{ success: boolean; data: NoticeData[] }>('/notices', { params: { caseId } });
    return data.data;
  },

  async getById(noticeId: string) {
    const { data } = await apiClient.get<{ success: boolean; data: NoticeData }>(`/notices/${noticeId}`);
    return data.data;
  },

  async listPendingReview() {
    const { data } = await apiClient.get<{ success: boolean; data: NoticeData[] }>('/notices/pending-review');
    return data.data;
  },

  async getGenerationStatus(noticeId: string) {
    const { data } = await apiClient.get<{ noticeId: string; status: string; error?: string; completedAt?: string }>(`/notices/${noticeId}/generation-status`);
    return data;
  },

  getDownloadUrl(noticeId: string, docIndex: number) {
    return `/api/notices/${noticeId}/download/${docIndex}`;
  },

  getDownloadAllUrl(noticeId: string) {
    return `/api/notices/${noticeId}/download-all`;
  },

  async regenerateDocuments(noticeId: string) {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(`/notices/${noticeId}/regenerate-documents`);
    return data;
  },

  // ── Version Management ────────────────────────────────

  async supersede(noticeId: string) {
    const { data } = await apiClient.post<{ success: boolean; data: NoticeData }>(`/notices/${noticeId}/supersede`);
    return data.data;
  },

  async getVersionChain(noticeId: string) {
    const { data } = await apiClient.get<{ success: boolean; data: NoticeData[] }>(`/notices/${noticeId}/versions`);
    return data.data;
  },

  async compareVersions(noticeId: string, otherId: string) {
    const { data } = await apiClient.get<{
      success: boolean;
      data: {
        diff: { changed: string[]; added: string[]; removed: string[]; unchanged: string[] };
        left: { _id: string; version: number; status: string; fields: Record<string, unknown> };
        right: { _id: string; version: number; status: string; fields: Record<string, unknown> };
      };
    }>(`/notices/${noticeId}/compare/${otherId}`);
    return data.data;
  },
};
