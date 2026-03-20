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
  type ChatMessageDetail,
  type ChatSession,
  type SummarizeResponse,
} from '@/services/ai-tutor';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  feedback?: 'UP' | 'DOWN' | 'NONE';
}

const defaultSettings: AISettings = {
  language: 'VI',
  responseLength: 'MEDIUM',
  communicationStyle: 'FRIENDLY',
};

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [chatLoading, setChatLoading] = useState(true);

  const [settings, setSettings] = useState<AISettings>(defaultSettings);
  const [savingSettings, setSavingSettings] = useState(false);

  const [summaryForm, setSummaryForm] = useState({ lessonId: '', content: '' });
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState<SummarizeResponse | null>(null);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadChatDetail = async (chatId: string) => {
    const detail = await getChatDetail(chatId);
    setMessages(
      detail.messages.map((msg: ChatMessageDetail) => ({
        id: msg.messageId,
        role: msg.sender === 'AI' ? 'assistant' : 'user',
        content: msg.content,
        feedback: msg.feedback,
      }))
    );
    setActiveChatId(chatId);
  };

  const reloadHistory = async () => {
    const history = await getChatHistory(0, 20);
    setChatSessions(history.content);
    return history.content;
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setChatLoading(true);
      setError('');
      try {
        const [history, aiSettings] = await Promise.all([
          getChatHistory(0, 20),
          getAISettings().catch(() => defaultSettings),
        ]);
        setChatSessions(history.content);
        setSettings(aiSettings);

        if (history.content[0]) {
          await loadChatDetail(history.content[0].chatId);
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
    const tempId = `tmp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, role: 'user', content: message }]);
    setInputValue('');

    try {
      const response = await sendChatMessage({
        message,
        contextId: activeChatId || undefined,
      });
      setActiveChatId(response.chatId);
      setMessages((prev) => [
        ...prev,
        {
          id: response.messageId,
          role: 'assistant',
          content: response.reply,
        },
      ]);
      await reloadHistory();
    } catch (err: any) {
      setError(err.message || 'Gửi tin nhắn thất bại.');
      setMessages((prev) => prev.filter((item) => item.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleFeedback = async (messageId: string, feedbackType: 'UP' | 'DOWN') => {
    try {
      await sendMessageFeedback(messageId, feedbackType);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, feedback: feedbackType } : msg))
      );
    } catch {
      // Ignore feedback failures and keep UX responsive
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChat(chatId);
      const history = await reloadHistory();
      if (chatId === activeChatId) {
        if (history[0]) {
          await loadChatDetail(history[0].chatId);
        } else {
          setActiveChatId(null);
          setMessages([]);
        }
      }
      setNotice('Đã xóa hội thoại.');
    } catch (err: any) {
      setError(err.message || 'Không thể xóa hội thoại.');
    }
  };

  const handleCreateNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setNotice('Đã tạo phiên chat mới.');
    setError('');
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      setError('');
      await updateAISettings(settings);
      setNotice('Đã cập nhật cài đặt AI.');
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật cài đặt AI.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSummarize = async (e: FormEvent) => {
    e.preventDefault();
    const content = summaryForm.content.trim();
    if (!content) return;

    try {
      setSummaryLoading(true);
      setError('');
      const parsedLessonId = Number(summaryForm.lessonId);
      const result = await summarizeLesson({
        lessonId: Number.isFinite(parsedLessonId) && parsedLessonId > 0 ? parsedLessonId : undefined,
        content,
      });
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
          <p>Chat, tóm tắt bài học, chỉnh style phản hồi và quản lý lịch sử hội thoại.</p>
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
                  onChange={(e) => setSettings((prev) => ({ ...prev, language: e.target.value as AISettings['language'] }))}
                >
                  <option value="VI">Tiếng Việt</option>
                  <option value="EN">English</option>
                </select>
              </label>
              <label>
                Độ dài phản hồi
                <select
                  value={settings.responseLength}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      responseLength: e.target.value as AISettings['responseLength'],
                    }))
                  }
                >
                  <option value="SHORT">Ngắn</option>
                  <option value="MEDIUM">Vừa</option>
                  <option value="LONG">Dài</option>
                </select>
              </label>
              <label>
                Phong cách
                <select
                  value={settings.communicationStyle}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      communicationStyle: e.target.value as AISettings['communicationStyle'],
                    }))
                  }
                >
                  <option value="FRIENDLY">Friendly</option>
                  <option value="PROFESSIONAL">Professional</option>
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
              <input
                type="number"
                placeholder="Lesson ID (tuỳ chọn)"
                value={summaryForm.lessonId}
                onChange={(e) => setSummaryForm((prev) => ({ ...prev, lessonId: e.target.value }))}
              />
              <textarea
                placeholder="Dán transcript hoặc nội dung bài học cần tóm tắt..."
                value={summaryForm.content}
                onChange={(e) => setSummaryForm((prev) => ({ ...prev, content: e.target.value }))}
                rows={4}
              />
              <button className={styles.actionBtn} type="submit" disabled={summaryLoading}>
                {summaryLoading ? 'Đang tóm tắt...' : 'Tạo tóm tắt'}
              </button>
            </div>

            {summaryResult && (
              <div className={styles.summaryResult}>
                <p>{summaryResult.summary}</p>
                <ul>
                  {summaryResult.keyPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
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
            ) : chatSessions.length === 0 ? (
              <p className={styles.muted}>Chưa có hội thoại.</p>
            ) : (
              <ul className={styles.historyList}>
                {chatSessions.map((chat) => (
                  <li key={chat.chatId} className={styles.historyItem}>
                    <button
                      className={`${styles.historyLink} ${activeChatId === chat.chatId ? styles.historyActive : ''}`}
                      onClick={() => loadChatDetail(chat.chatId)}
                    >
                      <span>{chat.title || 'Cuộc trò chuyện mới'}</span>
                      <small>{new Date(chat.updatedAt).toLocaleString('vi-VN')}</small>
                    </button>
                    <button className={styles.deleteBtn} onClick={() => handleDeleteChat(chat.chatId)}>
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
                      {msg.role === 'assistant' && (
                        <div className={styles.feedbackRow}>
                          <button className={styles.smallBtn} onClick={() => handleFeedback(msg.id, 'UP')}>
                            👍
                          </button>
                          <button className={styles.smallBtn} onClick={() => handleFeedback(msg.id, 'DOWN')}>
                            👎
                          </button>
                          {msg.feedback && (
                            <span className={styles.muted}>
                              {msg.feedback === 'UP' ? 'Đã thích' : 'Đã không thích'}
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
