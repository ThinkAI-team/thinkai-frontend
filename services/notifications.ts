import { apiRequest } from './api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  payload?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}

export interface NotificationPage {
  content: NotificationItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export async function getNotifications(page = 0, size = 20): Promise<NotificationPage> {
  return apiRequest<NotificationPage>(`/notifications?page=${page}&size=${size}`);
}

export async function getUnreadCount(): Promise<{ unreadCount: number }> {
  return apiRequest<{ unreadCount: number }>('/notifications/unread-count');
}

export async function markNotificationRead(id: number): Promise<NotificationItem> {
  return apiRequest<NotificationItem>(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  return apiRequest<{ updated: number }>('/notifications/read-all', {
    method: 'PATCH',
  });
}

export function openNotificationStream(
  token: string,
  handlers: {
    onNotification: (notification: NotificationItem) => void;
    onError?: () => void;
  }
): EventSource {
  const url = `${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
  const source = new EventSource(url);
  source.addEventListener('notification', (event) => {
    try {
      const parsed = JSON.parse((event as MessageEvent).data) as NotificationItem;
      handlers.onNotification(parsed);
    } catch {
      // ignore malformed payload
    }
  });
  source.addEventListener('error', () => {
    if (handlers.onError) handlers.onError();
  });
  return source;
}
