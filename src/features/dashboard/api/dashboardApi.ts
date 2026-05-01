import apiClient from '@/lib/apiClient';

export interface DashboardStats {
  totalCases: number;
  noticesByType: Record<string, number>;
  noticesByStatus: Record<string, number>;
  pendingReviewCount: number;
  noticesThisMonth: number;
  avgApprovalTimeHours: number | null;
  monthlyTrend: Array<{ month: string; count: number }>;
}

export interface RecentActivityItem {
  _id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  timestamp: string;
}

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    const res = await apiClient.get<{ success: boolean; data: DashboardStats }>('/dashboard/stats');
    return res.data.data;
  },

  async getRecentActivity(): Promise<RecentActivityItem[]> {
    const res = await apiClient.get<{ success: boolean; data: RecentActivityItem[] }>('/dashboard/recent-activity');
    return res.data.data;
  },
};
