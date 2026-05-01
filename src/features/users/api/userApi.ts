import apiClient from '../../../lib/apiClient';

export const userApi = {
  listUsers: (page = 1, limit = 20) =>
    apiClient.get(`/users?page=${page}&limit=${limit}`),

  getMe: () => apiClient.get('/users/me'),

  updateRole: (userId: string, role: string) =>
    apiClient.patch(`/users/${userId}/role`, { role }),

  deactivate: (userId: string) =>
    apiClient.patch(`/users/${userId}/deactivate`),

  createInvite: (email: string, role: string) =>
    apiClient.post('/users/invite', { email, role }),
};
