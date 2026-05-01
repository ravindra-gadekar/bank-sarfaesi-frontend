import apiClient from '../../../lib/apiClient';

export const branchApi = {
  getBranch: () => apiClient.get('/branch'),

  updateBranch: (data: Record<string, unknown>) =>
    apiClient.put('/branch', data),

  updateSso: (ssoConfigs: Record<string, unknown>[]) =>
    apiClient.put('/branch/sso', { ssoConfigs }),

  uploadLetterhead: (file: File) => {
    const formData = new FormData();
    formData.append('letterhead', file);
    return apiClient.post('/branch/letterhead', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
