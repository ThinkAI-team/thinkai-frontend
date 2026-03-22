'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dashboardStyles from '../dashboard/page.module.css';
import styles from './page.module.css';
import { ApiException } from '@/services/api';
import MainSidebar from '../components/MainSidebar';
import PageState from '@/components/ui/PageState';
import Button from '@/components/ui/Button';
import { formatDateTimeVi } from '@/lib/utils/format';
import {
  deleteChat,
  getAISettings,
  getChatDetail,
  getChatHistory,
  sendChatMessage,
  sendMessageFeedback,
  summarizeLesson,
  updateAISettings,
  type AISettings,
  type AiChatLog,
  type SummarizeResponse,
} from '@/services/ai-tutor';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sourceLogId?: number;
  rating?: number | null;
}

const defaultSettings: AISettings = {
  language: 'English',
  responseLength: 'detailed',
};

function logToMessages(log: AiChatLog): Message[] {
  return [
    {
      id: `${log.id}-user`,
      role: 'user',
      content: log.userMessage,
    },
    {
      id: `${log.id}-assistant`,
      role: 'assistant',
      content: log.aiResponse,
      sourceLogId: log.id,
      rating: typeof log.rating === 'number' ? log.rating : null,
    },
  ];
}

export default function AITutorPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [chatLogs, setChatLogs] = useState<AiChatLog[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [chatLoading, setChatLoading] = useState(true);

  const [settings, setSettings] = useState<AISettings>(defaultSettings);
  const [savingSettings, setSavingSettings] = useState(false);

  const [summaryContent, setSummaryContent] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState<SummarizeResponse | null>(null);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const reloadHistory = async (): Promise<AiChatLog[]> => {
    const history = await getChatHistory();
    setChatLogs(history);
    return history;
  };

  const loadChatDetail = useCallback(async (chatId: number) => {
    const detail = await getChatDetail(chatId);
    setMessages(logToMessages(detail));
    setSelectedLogId(chatId);
  }, []);

  const loadInitialData = useCallback(async () => {
    setChatLoading(true);
    setError('');
    try {
      const [history, aiSettings] = await Promise.all([
        getChatHistory(),
        getAISettings().catch(() => defaultSettings),
      ]);
      setChatLogs(history);
      setSettings({
        ...defaultSettings,
        ...aiSettings,
      });

      if (history[0]) {
        await loadChatDetail(history[0].id);
      } else {
        setSelectedLogId(null);
        setMessages([]);
      }
    } catch (err: any) {
      if (err instanceof ApiException && err.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setTimeout(() => router.push('/login'), 1200);
      } else {
        setError(err.message || 'Không thể tải dữ liệu AI Tutor.');
      }
    } finally {
      setChatLoading(false);
    }
  }, [loadChatDetail, router]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const message = inputValue.trim();
    if (!message || sending) return;

    setSending(true);
    setError('');
    setNotice('');

    const tempUserMessage: Message = {
      id: `tmp-user-${Date.now()}`,
      role: 'user',
      content: message,
    };

    setMessages((prev) => [...prev, tempUserMessage]);
    setInputValue('');

    try {
      const response = await sendChatMessage({
        message,
        context: selectedLogId ? `Follow-up from chat #${selectedLogId}` : undefined,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `tmp-assistant-${Date.now()}`,
          role: 'assistant',
          content: response.reply,
        },
      ]);

      const history = await reloadHistory();
      if (history[0]) {
        await loadChatDetail(history[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Gửi tin nhắn thất bại.');
      setMessages((prev) => prev.filter((item) => item.id !== tempUserMessage.id));
    } finally {
      setSending(false);
    }
  };

  const handleFeedback = async (logId: number, rating: -1 | 1) => {
    try {
      const updated = await sendMessageFeedback(logId, rating);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.sourceLogId === logId ? { ...msg, rating: updated.rating ?? rating } : msg
        )
      );
      setNotice('Đã ghi nhận đánh giá phản hồi AI.');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Không thể gửi đánh giá.');
    }
  };

  const handleDeleteChat = async (chatId: number) => {
    try {
      await deleteChat(chatId);
      const history = await reloadHistory();
      if (selectedLogId === chatId) {
        if (history[0]) {
          await loadChatDetail(history[0].id);
        } else {
          setSelectedLogId(null);
          setMessages([]);
        }
      }
      setNotice('Đã xóa hội thoại.');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Không thể xóa hội thoại.');
    }
  };

  const handleCreateNewChat = () => {
    setSelectedLogId(null);
    setMessages([]);
    setNotice('Đã tạo phiên chat mới.');
    setError('');
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      setError('');
      const updated = await updateAISettings(settings);
      setSettings((prev) => ({ ...prev, ...updated }));
      setNotice('Đã cập nhật cài đặt AI.');
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật cài đặt AI.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSummarize = async (e: FormEvent) => {
    e.preventDefault();
    const content = summaryContent.trim();
    if (!content) return;

    try {
      setSummaryLoading(true);
      setError('');
      const result = await summarizeLesson({ content });
      setSummaryResult(result);
      setNotice('Đã tạo tóm tắt bằng AI.');
    } catch (err: any) {
      setError(err.message || 'Không thể tóm tắt nội dung.');
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <div className={`${dashboardStyles.container} ${styles.container}`}>
      <MainSidebar active="ai-tutor" />

      <main className={`${dashboardStyles.main} ${styles.main}`}>
        <section className={styles.welcome}>
          <h1>Gia sư AI hỗ trợ học tập theo thời gian thực</h1>
          <p>Chat, tóm tắt bài học, chỉnh ngôn ngữ phản hồi và quản lý lịch sử hội thoại.</p>
        </section>

        {!chatLoading && error && chatLogs.length === 0 && messages.length === 0 ? (
          <PageState
            type="error"
            message={error}
            actionLabel="Thử tải lại"
            onAction={loadInitialData}
          />
        ) : (
          error && <p className={styles.errorText}>{error}</p>
        )}
        {notice && <p className={styles.noticeText}>{notice}</p>}

        <section className={styles.utilityGrid}>
          <div className={styles.utilityCard}>
            <h3>AI Settings</h3>
            <div className={styles.settingGrid}>
              <label>
                Ngôn ngữ
                <select
                  value={settings.language}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      language: e.target.value,
                    }))
                  }
                >
                  <option value="English">English</option>
                  <option value="Vietnamese">Tiếng Việt</option>
                </select>
              </label>
              <label>
                Độ dài phản hồi
                <select
                  value={settings.responseLength}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      responseLength: e.target.value,
                    }))
                  }
                >
                  <option value="short">Ngắn</option>
                  <option value="medium">Vừa</option>
                  <option value="detailed">Dài</option>
                </select>
              </label>
            </div>
            <Button variant="primary" size="sm" type="button" onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings ? 'Đang lưu...' : 'Lưu cài đặt AI'}
            </Button>
          </div>

          <form className={styles.utilityCard} onSubmit={handleSummarize}>
            <h3>Tóm tắt bài học</h3>
            <div className={styles.summaryForm}>
              <textarea
                placeholder="Dán transcript hoặc nội dung bài học cần tóm tắt..."
                value={summaryContent}
                onChange={(e) => setSummaryContent(e.target.value)}
                rows={4}
              />
              <Button variant="primary" size="sm" type="submit" disabled={summaryLoading}>
                {summaryLoading ? 'Đang tóm tắt...' : 'Tạo tóm tắt'}
              </Button>
            </div>

            {summaryResult && (
              <div className={styles.summaryResult}>
                <p>{summaryResult.summary}</p>
                {Array.isArray(summaryResult.keyPoints) && summaryResult.keyPoints.length > 0 && (
                  <ul>
                    {summaryResult.keyPoints.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </form>
        </section>

        <section className={styles.chatLayout}>
          <aside className={styles.historyPanel}>
            <div className={styles.historyHeader}>
              <h3>Lịch sử chat</h3>
              <Button variant="secondary" size="sm" type="button" onClick={handleCreateNewChat}>
                + Mới
              </Button>
            </div>

            {chatLoading ? (
              <PageState type="loading" message="Đang tải lịch sử hội thoại..." />
            ) : chatLogs.length === 0 ? (
              <PageState type="empty" message="Chưa có hội thoại." />
            ) : (
              <ul className={styles.historyList}>
                {chatLogs.map((chat) => (
                  <li key={chat.id} className={styles.historyItem}>
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      className={`${styles.historyLink} ${selectedLogId === chat.id ? styles.historyActive : ''}`}
                      aria-current={selectedLogId === chat.id ? 'true' : undefined}
                      onClick={() => loadChatDetail(chat.id)}
                    >
                      <span>{chat.userMessage.slice(0, 48) || 'Cuộc trò chuyện mới'}</span>
                      <small>{formatDateTimeVi(chat.createdAt)}</small>
                    </Button>
                    <Button
                      className={styles.deleteBtn}
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={() => handleDeleteChat(chat.id)}
                      aria-label="Xóa hội thoại"
                      title="Xóa hội thoại"
                    >
                      ✕
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <div className={styles.chatPanel}>
            <div className={styles.messages}>
              {messages.length === 0 ? (
                <PageState type="empty" message="Chưa có hội thoại. Hãy gửi tin nhắn đầu tiên." />
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`${styles.message} ${styles[msg.role]}`}>
                    {msg.role === 'assistant' && <div className={styles.avatarIcon}>AI</div>}
                    <div className={styles.messageContent}>
                      {msg.content.split('\n').map((line, idx) => (
                        <p key={`${msg.id}-${idx}`}>{line}</p>
                      ))}

                      {msg.role === 'assistant' && typeof msg.sourceLogId === 'number' && (
                        <div className={styles.feedbackRow}>
                          <Button
                            className={styles.smallBtn}
                            variant="secondary"
                            size="sm"
                            type="button"
                            onClick={() => handleFeedback(msg.sourceLogId!, 1)}
                          >
                            Hữu ích
                          </Button>
                          <Button
                            className={styles.smallBtn}
                            variant="secondary"
                            size="sm"
                            type="button"
                            onClick={() => handleFeedback(msg.sourceLogId!, -1)}
                          >
                            Chưa phù hợp
                          </Button>
                          {typeof msg.rating === 'number' && (
                            <span className={styles.muted}>
                              {msg.rating > 0 ? 'Đã thích' : 'Đã không thích'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSubmit} className={styles.inputArea}>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Hỏi ThinkAI bất cứ điều gì..."
                  className={styles.chatInput}
                />
                <Button type="submit" variant="warm" size="sm" className={styles.sendBtn} disabled={sending}>
                  {sending ? '...' : 'Gửi'}
                </Button>
              </div>
              <p className={styles.disclaimer}>ThinkAI có thể mắc lỗi, hãy kiểm tra lại thông tin quan trọng.</p>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
