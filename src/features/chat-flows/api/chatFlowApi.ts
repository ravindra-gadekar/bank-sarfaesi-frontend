import apiClient from '../../../lib/apiClient';
import type { ChatFlowConfig, QuestionNode } from '../types';

export const chatFlowApi = {
  /** List all configs visible to the current branch (branch-specific + global). */
  listConfigs: () =>
    apiClient.get<{ success: boolean; data: ChatFlowConfig[] }>('/chat-flow/configs/all'),

  /** Get a single config by ID. */
  getConfigById: (id: string) =>
    apiClient.get<{ success: boolean; data: ChatFlowConfig }>(`/chat-flow/configs/${encodeURIComponent(id)}`),

  /** Get version history for a notice type. */
  getVersionHistory: (noticeType: string) =>
    apiClient.get<{ success: boolean; data: ChatFlowConfig[] }>(
      `/chat-flow/configs/history/${encodeURIComponent(noticeType)}`,
    ),

  /** Clone global default to branch. */
  cloneFromDefault: (noticeType: string) =>
    apiClient.post<{ success: boolean; data: ChatFlowConfig }>('/chat-flow/configs/clone', {
      noticeType,
    }),

  /** Update a config (creates a new version). */
  updateConfig: (id: string, data: { questionFlow?: QuestionNode[]; keywordAnswerMap?: Record<string, string> }) =>
    apiClient.put<{ success: boolean; data: ChatFlowConfig }>(
      `/chat-flow/configs/${encodeURIComponent(id)}`,
      data,
    ),

  /** Activate a specific config version. */
  activateConfig: (id: string) =>
    apiClient.post<{ success: boolean; data: ChatFlowConfig }>(
      `/chat-flow/configs/${encodeURIComponent(id)}/activate`,
    ),
};
