import apiClient from '../../../lib/apiClient';

export const authApi = {
  requestOtp: (email: string) => apiClient.post('/auth/otp/request', { email }),
  verifyOtp: (email: string, otp: string) =>
    apiClient.post('/auth/otp/verify', { email, otp }),
  myBranches: () => apiClient.get('/auth/my-branches'),
  myOffices: () => apiClient.get('/auth/my-branches'),
  selectBranch: (branchId: string) =>
    apiClient.post('/auth/select-branch', { branchId }),
  selectOffice: (officeId: string) =>
    apiClient.post('/auth/select-office', { officeId }),
  refreshSession: () => apiClient.post('/auth/refresh'),
  logout: () => apiClient.post('/auth/logout'),
  checkEmail: (email: string) =>
    apiClient.post('/auth/signup/check-email', { email }),
  ssoInit: (email: string) => apiClient.post('/auth/sso/init', { email }),
};
