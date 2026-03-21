'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
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

  const loadChatDetail = async (chatId: number) => {
    const detail = await getChatDetail(chatId);
    setMessages(logToMessages(detail));
    setSelectedLogId(chatId);
  };

  useEffect(() => {
    const fetchInitialData = async () => {
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
        }
      } catch (err: any) {
        setError(err.message || 'Không thể tải dữ liệu AI Tutor.');
      } finally {
        setChatLoading(false);
      }
    };

    fetchInitialData();
  }, []);

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
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🎯</span>
          <span className={styles.logoText}>ThinkAI</span>
        </Link>

        <nav className={styles.nav}>
          <Link href="/courses">Lộ trình học</Link>
          <Link href="/exams">Luyện thi</Link>
          <Link href="/dashboard">Tiến độ</Link>
        </nav>

        <div className={styles.headerActions}>
          <Link href="/settings" className={styles.upgradeBtn}>
            Cài đặt →
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.welcome}>
          <h1>Gia sư AI hỗ trợ học tập theo thời gian thực</h1>
          <p>Chat, tóm tắt bài học, chỉnh ngôn ngữ phản hồi và quản lý lịch sử hội thoại.</p>
        </section>

        {error && <p className={styles.errorText}>{error}</p>}
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
            <button className={styles.actionBtn} onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings ? 'Đang lưu...' : 'Lưu cài đặt AI'}
            </button>
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
              <button className={styles.actionBtn} type="submit" disabled={summaryLoading}>
                {summaryLoading ? 'Đang tóm tắt...' : 'Tạo tóm tắt'}
              </button>
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
              <button className={styles.smallBtn} onClick={handleCreateNewChat}>
                + Mới
              </button>
            </div>

            {chatLoading ? (
              <p className={styles.muted}>Đang tải lịch sử...</p>
            ) : chatLogs.length === 0 ? (
              <p className={styles.muted}>Chưa có hội thoại.</p>
            ) : (
              <ul className={styles.historyList}>
                {chatLogs.map((chat) => (
                  <li key={chat.id} className={styles.historyItem}>
                    <button
                      className={`${styles.historyLink} ${selectedLogId === chat.id ? styles.historyActive : ''}`}
                      onClick={() => loadChatDetail(chat.id)}
                    >
                      <span>{chat.userMessage.slice(0, 48) || 'Cuộc trò chuyện mới'}</span>
                      <small>{new Date(chat.createdAt).toLocaleString('vi-VN')}</small>
                    </button>
                    <button className={styles.deleteBtn} onClick={() => handleDeleteChat(chat.id)}>
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <div className={styles.chatPanel}>
            <div className={styles.messages}>
              {messages.length === 0 ? (
                <p className={styles.muted}>Chưa có hội thoại. Hãy gửi tin nhắn đầu tiên.</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`${styles.message} ${styles[msg.role]}`}>
                    {msg.role === 'assistant' && <div className={styles.avatarIcon}>🎯</div>}
                    <div className={styles.messageContent}>
                      {msg.content.split('\n').map((line, idx) => (
                        <p key={`${msg.id}-${idx}`}>{line}</p>
                      ))}

                      {msg.role === 'assistant' && typeof msg.sourceLogId === 'number' && (
                        <div className={styles.feedbackRow}>
                          <button className={styles.smallBtn} onClick={() => handleFeedback(msg.sourceLogId!, 1)}>
                            👍
                          </button>
                          <button className={styles.smallBtn} onClick={() => handleFeedback(msg.sourceLogId!, -1)}>
                            👎
                          </button>
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
                <button type="submit" className={styles.sendBtn} disabled={sending}>
                  {sending ? '...' : '➤'}
                </button>
              </div>
              <p className={styles.disclaimer}>ThinkAI có thể mắc lỗi, hãy kiểm tra lại thông tin quan trọng.</p>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
