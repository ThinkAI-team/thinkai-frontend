import { apiRequest } from './api';

export const USE_AI_HARNESS_KEY = 'thinkai_use_harness';

export interface ThinkingStep {
  step: string;
  description: string;
  latencyMs: number;
  success: boolean;
}

export interface StreamStep {
  type: 'step' | 'done' | 'error';
  index?: number;
  step?: string;
  description?: string;
  latencyMs?: number;
  success?: boolean;
  content?: string;
  conversationId?: string;
  message?: string;
}

export interface HarnessConversation {
  conversationId: string;
  title: string;
  lastMessagePreview: string;
  lastMessageAt: string;
  messageCount: number;
}

export function getUseHarness(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(USE_AI_HARNESS_KEY) !== 'false';
}

export function setUseHarness(value: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USE_AI_HARNESS_KEY, String(value));
}

export async function sendChatMessageHarness(payload: {
  message: string;
  context?: string;
  conversationId?: string;
  language?: string;
  responseLength?: string;
  communicationStyle?: string;
  correctionMode?: string;
  answerFormat?: string;
  metadata?: Record<string, unknown>;
}): Promise<{
  reply: string;
  conversationId: string;
  messageId?: number;
  agentType?: string;
  thinkingSteps?: ThinkingStep[];
}> {
  return apiRequest('/ai-harness/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function streamChatMessage(
  payload: {
    message: string;
    context?: string;
    conversationId?: string;
    language?: string;
    responseLength?: string;
    communicationStyle?: string;
    correctionMode?: string;
    answerFormat?: string;
    metadata?: Record<string, unknown>;
  },
  onStep: (step: StreamStep) => void,
  onComplete: (content: string, conversationId: string) => void,
  onError: (error: string) => void
): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('thinkai_access_token') : '';
  
  try {
    const response = await fetch('/ai-harness/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) {
      throw new Error('No response body');
    }

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        
        const data = trimmed.slice(5).trim();
        if (!data) continue;
        
        try {
          const parsed = JSON.parse(data) as StreamStep;
          
          if (parsed.type === 'step') {
            onStep(parsed);
          } else if (parsed.type === 'done') {
            onComplete(parsed.content || '', parsed.conversationId || '');
          } else if (parsed.type === 'error') {
            onError(parsed.message || 'Unknown error');
          }
        } catch (e) {
          console.warn('Failed to parse SSE data:', data);
        }
      }
    }
  } catch (error: any) {
    onError(error.message || 'Connection failed');
  }
}

export async function getHarnessHistory(): Promise<HarnessConversation[]> {
  return apiRequest('/ai-harness/history');
}

export async function getHarnessConversation(conversationId: string): Promise<HarnessConversation> {
  return apiRequest(`/ai-harness/chat/${conversationId}`);
}

export interface UserMemory {
  userId?: number;
  userLevel?: string | null;
  targetExam?: string | null;
  targetScore?: number | null;
  weakPoints?: string;
  strongPoints?: string;
  lessonContext?: string;
  adaptiveRules?: string | null;
}

export async function getUserMemory(): Promise<UserMemory> {
  return apiRequest('/ai-harness/memory');
}

export async function updateUserMemory(memory: UserMemory): Promise<UserMemory> {
  return apiRequest('/ai-harness/memory', {
    method: 'PUT',
    body: JSON.stringify(memory),
  });
}
