'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import Button from '@/components/ui/Button';
import {
  type NotificationItem,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  openNotificationStream,
} from '@/services/notifications';
import styles from './NotificationBell.module.css';

function formatTime(input?: string): string {
  if (!input) return '';
  try {
    return new Date(input).toLocaleString('vi-VN');
  } catch {
    return '';
  }
}

export default function NotificationBell() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [popupItem, setPopupItem] = useState<NotificationItem | null>(null);
  const [mounted, setMounted] = useState(false);

  const topItems = useMemo(() => items.slice(0, 20), [items]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let source: EventSource | null = null;
    const token = typeof window !== 'undefined' ? localStorage.getItem('thinkai_access_token') : null;
    const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!token || !userRaw) return;

    const bootstrap = async () => {
      try {
        const [countData, pageData] = await Promise.all([
          getUnreadCount(),
          getNotifications(0, 20),
        ]);
        setUnreadCount(countData.unreadCount || 0);
        setItems(pageData.content || []);
      } catch {
        // ignore bootstrap errors
      }
    };

    bootstrap();
    source = openNotificationStream(token, {
      onNotification: (notification) => {
        setItems((prev) => [notification, ...prev.filter((item) => item.id !== notification.id)].slice(0, 50));
        setUnreadCount((prev) => prev + (notification.isRead ? 0 : 1));
        setPopupItem(notification);
        if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
        popupTimerRef.current = setTimeout(() => setPopupItem(null), 5000);
      },
      onError: () => {
        // keep silent to avoid noisy UI
      },
    });

    return () => {
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
      if (source) source.close();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (!next) return;
    try {
      const pageData = await getNotifications(0, 20);
      setItems(pageData.content || []);
    } catch {
      // ignore dropdown refresh errors
    }
  };

  const handleClickNotification = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await markNotificationRead(item.id);
        setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, isRead: true } : it)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // ignore read failure
      }
    }

    const courseId = item.payload?.courseId;
    if (courseId) {
      router.push(`/courses/${courseId}`);
      setOpen(false);
    }
  };

  const handleReadAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((it) => ({ ...it, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore failure
    }
  };

  const handlePopupClick = () => {
    if (!popupItem) return;
    handleClickNotification(popupItem);
    setPopupItem(null);
  };

  return (
    <>
      {mounted && popupItem && createPortal(
        <div className={styles.popupCenterWrap}>
          <button type="button" className={styles.popupCenter} onClick={handlePopupClick}>
            <span className={styles.popupTitle}>{popupItem.title}</span>
            <span className={styles.popupMessage}>{popupItem.message}</span>
            <span className={styles.popupHint}>Nhấn để xem chi tiết</span>
          </button>
          <button
            type="button"
            className={styles.popupClose}
            onClick={() => setPopupItem(null)}
            aria-label="Đóng thông báo"
          >
            ×
          </button>
        </div>,
        document.body
      )}

      <div className={styles.wrapper} ref={rootRef}>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          className={styles.bellBtn}
          onClick={handleOpen}
          aria-label="Thông báo"
        >
          🔔
          {unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </Button>

        {open && (
          <div className={styles.dropdown}>
            <div className={styles.header}>
              <span className={styles.title}>Thông báo</span>
              {unreadCount > 0 && (
                <button type="button" className={styles.markAllBtn} onClick={handleReadAll}>
                  Đánh dấu đã đọc
                </button>
              )}
            </div>
            {topItems.length === 0 ? (
              <div className={styles.empty}>Chưa có thông báo.</div>
            ) : (
              <ul className={styles.list}>
                {topItems.map((item) => (
                  <li
                    key={item.id}
                    className={`${styles.item} ${!item.isRead ? styles.itemUnread : ''}`}
                  >
                    <button
                      type="button"
                      className={styles.itemBtn}
                      onClick={() => handleClickNotification(item)}
                    >
                      <span className={styles.itemTitle}>{item.title}</span>
                      <span className={styles.itemMessage}>{item.message}</span>
                      <span className={styles.itemTime}>{formatTime(item.createdAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}
