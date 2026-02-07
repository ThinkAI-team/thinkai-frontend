import apiClient, { handleApiError } from './client';
import type { 
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ApiResponse 
} from '../types';

interface Conversation {
  id: number;
  title: string;
  lastMessage: string;
  updatedAt: string;
}

/**
 * AI Tutor API endpoints
 */
export const aiTutorApi = {
  /**
   * Send message to AI tutor
   */
  sendMessage: async (data: ChatRequest): Promise<ChatResponse> => {
    try {
      const response = await apiClient.post<ApiResponse<ChatResponse>>('/api/ai/chat', data);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Stream message from AI tutor (for real-time response)
   */
  streamMessage: (data: ChatRequest, onChunk: (chunk: string) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('thinkai_access_token')}`,
        },
        body: JSON.stringify(data),
      })
        .then(response => {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          
          const read = (): Promise<void> => {
            return reader!.read().then(({ done, value }) => {
              if (done) {
                resolve();
                return;
              }
              
              const chunk = decoder.decode(value);
              onChunk(chunk);
              return read();
            });
          };
          
          return read();
        })
        .catch(reject);
    });
  },

  /**
   * Get chat history
   */
  getChatHistory: async (conversationId?: number): Promise<ChatMessage[]> => {
    try {
      const url = conversationId 
        ? `/api/ai/history/${conversationId}`
        : '/api/ai/history';
      const response = await apiClient.get<ApiResponse<ChatMessage[]>>(url);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get all conversations
   */
  getConversations: async (): Promise<Conversation[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Conversation[]>>('/api/ai/conversations');
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete conversation
   */
  deleteConversation: async (conversationId: number): Promise<void> => {
    try {
      await apiClient.delete(`/api/ai/conversations/${conversationId}`);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Clear all chat history
   */
  clearHistory: async (): Promise<void> => {
    try {
      await apiClient.delete('/api/ai/history');
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default aiTutorApi;
