import { apiRequest } from './api';

export interface ChatRequest {
  message: string;
  context?: string;
}

export interface ChatResponse {
  reply: string;
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

export async function getChatHistory(): Promise<AiChatLog[]> {
  return apiRequest<AiChatLog[]>('/ai/chat/history');
}

export async function getChatDetail(chatId: number): Promise<AiChatLog> {
  return apiRequest<AiChatLog>(`/ai/chat/${chatId}`);
}

export async function deleteChat(chatId: number): Promise<void> {
  return apiRequest<void>(`/ai/chat/${chatId}`, { method: 'DELETE' });
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
