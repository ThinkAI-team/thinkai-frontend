import { apiRequest } from './api';

export interface ChatRequest {
  message: string;
  contextId?: string;
}

export interface ChatResponse {
  chatId: string;
  messageId: string;
  reply: string;
  timestamp: string;
}

export interface ChatSession {
  chatId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSessionPage {
  content: ChatSession[];
  totalPages: number;
  totalElements: number;
}

export interface ChatMessageDetail {
  messageId: string;
  sender: 'USER' | 'AI';
  content: string;
  timestamp: string;
  feedback?: 'UP' | 'DOWN' | 'NONE';
}

export interface ChatDetail {
  chatId: string;
  title: string;
  messages: ChatMessageDetail[];
}

export interface AISettings {
  language: 'VI' | 'EN';
  responseLength: 'SHORT' | 'MEDIUM' | 'LONG';
  communicationStyle: 'FRIENDLY' | 'PROFESSIONAL';
}

export interface SummarizeRequest {
  lessonId?: number;
  content: string;
}

export interface SummarizeResponse {
  summary: string;
  keyPoints: string[];
}

export async function sendChatMessage(payload: ChatRequest): Promise<ChatResponse> {
  return apiRequest<ChatResponse>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getChatHistory(page = 0, size = 10): Promise<ChatSessionPage> {
  return apiRequest<ChatSessionPage>(`/ai/chat/history?page=${page}&size=${size}`);
}

export async function getChatDetail(chatId: string): Promise<ChatDetail> {
  return apiRequest<ChatDetail>(`/ai/chat/${chatId}`);
}

export async function deleteChat(chatId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/ai/chat/${chatId}`, { method: 'DELETE' });
}

export async function getAISettings(): Promise<AISettings> {
  return apiRequest<AISettings>('/ai/settings');
}

export async function updateAISettings(payload: AISettings): Promise<{ message: string; settings: AISettings }> {
  return apiRequest<{ message: string; settings: AISettings }>('/ai/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function sendMessageFeedback(
  messageId: string,
  feedbackType: 'UP' | 'DOWN',
  comment?: string
): Promise<{ message: string; feedbackId: string }> {
  return apiRequest<{ message: string; feedbackId: string }>(`/ai/chat/${messageId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ feedbackType, comment }),
  });
}

export async function summarizeLesson(payload: SummarizeRequest): Promise<SummarizeResponse> {
  return apiRequest<SummarizeResponse>('/ai/summarize', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
