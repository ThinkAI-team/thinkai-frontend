import { apiRequest, apiRequestFormData } from './api';

export type AgentType = 'TUTOR' | 'LEARNING' | 'COURSE_OPS' | 'EXAM_OPS' | 'SAFETY_POLICY';

export interface AiAgentInfo {
  currentAgent: AgentType;
  agentDisplayName: string;
  agentDescription: string;
  canExecute: boolean;
  availableActions: string[];
  requiredPermissions: string[];
}

export interface AiPendingAction {
  id: number;
  action: string;
  payload: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string;
}

export interface AiActionConfirmResult {
  success: boolean;
  message: string;
  action: string;
}

export interface AiTrace {
  createdAt: string;
  userId: number;
  conversationId: string;
  agentType: AgentType;
  action: string;
  message: string;
  result: string;
  requiresMoreInfo: boolean;
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  toolCallChain?: string;
}

export interface AiTutorUiAction {
  type: string;
  label: string;
  accept?: string;
  targetField?: string;
  hint?: string;
}

export interface ChatRequest {
  message: string;
  context?: string;
  conversationId?: string;
}

export interface ChatResponse {
  reply: string;
  conversationId: string;
  messageId?: number;
  actions?: AiTutorUiAction[];
  agentType?: AgentType;
  pendingAction?: AiPendingAction;
  needsMoreInfo?: boolean;
  missingFields?: string[];
  missingField?: string;
}

export interface AiChatLog {
  id: number;
  userId: number;
  courseId?: number | null;
  lessonId?: number | null;
  userMessage: string;
  aiResponse: string;
  citations?: string | null;
  rating?: number | null;
  responseTimeMs?: number | null;
  createdAt: string;
}

export interface AiChatConversation {
  conversationId: string;
  title: string;
  lastMessagePreview: string;
  lastMessageAt: string;
  messageCount: number;
}

export interface AiChatConversationDetail {
  conversationId: string;
  title: string;
  messages: AiChatLog[];
}

export interface AISettings {
  language: string;
  responseLength: string;
  communicationStyle?: string;
}

export interface SummarizeRequest {
  content: string;
}

export interface SummarizeResponse {
  summary: string;
  keyPoints?: string[];
}

export async function sendChatMessage(payload: ChatRequest): Promise<ChatResponse> {
  return apiRequest<ChatResponse>('/ai-tutor/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getChatHistory(): Promise<AiChatConversation[]> {
  return apiRequest<AiChatConversation[]>('/ai/chat/history');
}

export async function getChatDetail(conversationId: string): Promise<AiChatConversationDetail> {
  return apiRequest<AiChatConversationDetail>(`/ai/chat/${conversationId}`);
}

export async function deleteChat(conversationId: string): Promise<void> {
  return apiRequest<void>(`/ai/chat/${conversationId}`, { method: 'DELETE' });
}

export async function renameChat(conversationId: string, title: string): Promise<AiChatConversationDetail> {
  return apiRequest<AiChatConversationDetail>(`/ai/chat/${conversationId}/title`, {
    method: 'PUT',
    body: JSON.stringify({ title }),
  });
}

export async function getAISettings(): Promise<AISettings> {
  return apiRequest<AISettings>('/ai/settings');
}

export async function updateAISettings(payload: AISettings): Promise<AISettings> {
  return apiRequest<AISettings>('/ai/settings', {
    method: 'PUT',
    body: JSON.stringify({
      language: payload.language,
      responseLength: payload.responseLength,
    }),
  });
}

export async function sendMessageFeedback(
  messageId: number,
  rating: -1 | 1
): Promise<AiChatLog> {
  return apiRequest<AiChatLog>(`/ai/chat/${messageId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ rating }),
  });
}

export async function summarizeLesson(payload: SummarizeRequest): Promise<SummarizeResponse> {
  return apiRequest<SummarizeResponse>('/ai-tutor/summarize', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadAiTutorFile(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequestFormData<{ url: string }>('/api/files/upload', formData, {
    method: 'POST',
  });
}

export async function getPendingAction(conversationId: string): Promise<AiPendingAction | null> {
  return apiRequest<AiPendingAction | null>(`/ai/chat/${conversationId}/pending-action`);
}

export async function confirmPendingAction(conversationId: string): Promise<AiActionConfirmResult> {
  return apiRequest<AiActionConfirmResult>(`/ai/chat/${conversationId}/confirm-action`, {
    method: 'POST',
  });
}

export async function cancelPendingAction(conversationId: string): Promise<void> {
  return apiRequest<void>(`/ai/chat/${conversationId}/cancel-action`, {
    method: 'POST',
  });
}

export async function getConversationTraces(conversationId: string): Promise<AiTrace[]> {
  return apiRequest<AiTrace[]>(`/ai/chat/${conversationId}/traces`);
}
