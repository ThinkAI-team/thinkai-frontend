'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
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
  renameChat,
  sendChatMessage,
  sendMessageFeedback,
  summarizeLesson,
  uploadAiTutorFile,
  updateAISettings,
  type AISettings,
  type AiChatConversation,
  type AiChatLog,
  type AiTutorUiAction,
  type SummarizeResponse,
} from '@/services/ai-tutor';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sourceLogId?: number;
  rating?: number | null;
  actions?: AiTutorUiAction[];
}

const defaultSettings: AISettings = {
  language: 'English',
  responseLength: 'detailed',
};

function logToMessages(log: AiChatLog): Message[] {
  let parsedActions: AiTutorUiAction[] = [];
  if (log.citations) {
    try {
      const parsed = JSON.parse(log.citations);
      if (Array.isArray(parsed)) {
        parsedActions = parsed;
      }
    } catch {
      parsedActions = [];
    }
  }

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
      actions: parsedActions,
    },
  ];
}

export default function AITutorPage() {
  const router = useRouter();
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [chatLogs, setChatLogs] = useState<AiChatConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(true);
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [renaming, setRenaming] = useState(false);

  const [settings, setSettings] = useState<AISettings>(defaultSettings);
  const [savingSettings, setSavingSettings] = useState(false);

  const [summaryContent, setSummaryContent] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState<SummarizeResponse | null>(null);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const reloadHistory = async (): Promise<AiChatConversation[]> => {
    const history = await getChatHistory();
    setChatLogs(history);
    return history;
  };

  const loadChatDetail = useCallback(async (conversationId: string) => {
    const detail = await getChatDetail(conversationId);
    setMessages(detail.messages.flatMap(logToMessages));
    setSelectedConversationId(conversationId);
    setRenamingConversationId(null);
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
        await loadChatDetail(history[0].conversationId);
      } else {
        setSelectedConversationId(null);
        setMessages([]);
      }
    } catch (err: any) {
      if (err instanceof ApiException && err.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setTimeout(() => router.push('/login'), 1200);
      } else {
        setError(err.message || 'Không thể tải dữ liệu Bò Trang.');
      }
    } finally {
      setChatLoading(false);
    }
  }, [loadChatDetail, router]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const box = messagesRef.current;
    if (!box) return;
    box.scrollTop = box.scrollHeight;
  }, [messages, sending]);

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
        context: selectedConversationId ? `Follow-up in conversation ${selectedConversationId}` : undefined,
        conversationId: selectedConversationId ?? undefined,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: response.messageId ? `${response.messageId}-assistant` : `tmp-assistant-${Date.now()}`,
          role: 'assistant',
          content: response.reply,
          sourceLogId: response.messageId,
          rating: null,
          actions: response.actions || [],
        },
      ]);

      if (response.conversationId) {
        setSelectedConversationId(response.conversationId);
      }
      await reloadHistory();
    } catch (err: any) {
      setError(err.message || 'Gửi tin nhắn thất bại.');
      setInputValue(message);
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
      setNotice('Đã ghi nhận đánh giá phản hồi của Bò Trang.');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Không thể gửi đánh giá.');
    }
  };

  const handleDeleteChat = async (conversationId: string) => {
    try {
      await deleteChat(conversationId);
      const history = await reloadHistory();
      if (selectedConversationId === conversationId) {
        if (history[0]) {
          await loadChatDetail(history[0].conversationId);
        } else {
          setSelectedConversationId(null);
          setMessages([]);
        }
      }
      setRenamingConversationId((prev) => (prev === conversationId ? null : prev));
      setNotice('Đã xóa hội thoại.');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Không thể xóa hội thoại.');
    }
  };

  const handleCreateNewChat = () => {
    setSelectedConversationId(null);
    setMessages([]);
    setRenamingConversationId(null);
    setNotice('Đã tạo phiên chat mới.');
    setError('');
  };

  const handleStartRename = (chat: AiChatConversation) => {
    setRenamingConversationId(chat.conversationId);
    setRenameTitle(chat.title || '');
    setError('');
  };

  const handleCancelRename = () => {
    setRenamingConversationId(null);
    setRenameTitle('');
  };

  const handleConfirmRename = async (conversationId: string) => {
    const title = renameTitle.trim();
    if (!title) {
      setError('Tên hội thoại không được để trống.');
      return;
    }

    try {
      setRenaming(true);
      await renameChat(conversationId, title);
      await reloadHistory();
      if (selectedConversationId === conversationId) {
        await loadChatDetail(conversationId);
      }
      setRenamingConversationId(null);
      setRenameTitle('');
      setNotice('Đã đổi tên hội thoại.');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Không thể đổi tên hội thoại.');
    } finally {
      setRenaming(false);
    }
  };

  const handleAssistantAction = (action: AiTutorUiAction) => {
    if (action.type !== 'UPLOAD_FILE') return;

    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = action.accept || '*/*';
    picker.onchange = async () => {
      const file = picker.files?.[0];
      if (!file) return;

      try {
        setNotice('Đang upload file...');
        setError('');
        const uploaded = await uploadAiTutorFile(file);
        const key = action.targetField || 'fileUrl';
        const injected = `{"${key}":"${uploaded.url}"}`;
        setInputValue((prev) => (prev ? `${prev}\n${injected}` : injected));
        setNotice(`Đã upload file thành công. URL đã được chèn vào ô nhập (${key}).`);
      } catch (err: any) {
        setError(err.message || 'Không thể upload file.');
      }
    };
    picker.click();
  };

  const handleUploadForAnalysis = () => {
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = 'image/*,.pdf,.txt,.md,.doc,.docx';
    picker.onchange = async () => {
      const file = picker.files?.[0];
      if (!file) return;

      try {
        setNotice('Đang upload file...');
        setError('');
        const uploaded = await uploadAiTutorFile(file);
        const line = `Hãy phân tích file này và hướng dẫn mình học tốt hơn: ${uploaded.url}`;
        setInputValue((prev) => (prev ? `${prev}\n${line}` : line));
        setNotice('Đã upload file. URL đã được chèn vào ô nhập.');
      } catch (err: any) {
        setError(err.message || 'Không thể upload file.');
      }
    };
    picker.click();
  };

  const handleCopyReply = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setNotice('Đã copy câu trả lời.');
      setError('');
    } catch {
      setError('Không thể copy. Trình duyệt chưa cấp quyền clipboard.');
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      setError('');
      const updated = await updateAISettings(settings);
      setSettings((prev) => ({ ...prev, ...updated }));
      setNotice('Đã cập nhật cài đặt Bò Trang.');
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
          <h1>Bò Trang hỗ trợ học tập theo thời gian thực</h1>
          <p>Chat với Bò Trang, tóm tắt bài học, chỉnh ngôn ngữ phản hồi và quản lý lịch sử hội thoại.</p>
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
            <h3>Cài đặt Bò Trang</h3>
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
              {savingSettings ? 'Đang lưu...' : 'Lưu cài đặt Bò Trang'}
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
                  <li key={chat.conversationId} className={styles.historyItem}>
                    <div className={styles.historyMain}>
                      <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        className={`${styles.historyLink} ${selectedConversationId === chat.conversationId ? styles.historyActive : ''}`}
                        aria-current={selectedConversationId === chat.conversationId ? 'true' : undefined}
                        onClick={() => loadChatDetail(chat.conversationId)}
                      >
                        <span>{chat.title || 'Cuộc trò chuyện mới'}</span>
                        <small>{formatDateTimeVi(chat.lastMessageAt)}</small>
                      </Button>

                      {renamingConversationId === chat.conversationId ? (
                        <div className={styles.renameRow}>
                          <input
                            value={renameTitle}
                            onChange={(e) => setRenameTitle(e.target.value)}
                            className={styles.renameInput}
                            maxLength={120}
                            placeholder="Nhập tên hội thoại"
                          />
                          <Button
                            className={styles.smallBtn}
                            variant="primary"
                            size="sm"
                            type="button"
                            onClick={() => handleConfirmRename(chat.conversationId)}
                            disabled={renaming}
                          >
                            {renaming ? '...' : 'Lưu'}
                          </Button>
                          <Button
                            className={styles.smallBtn}
                            variant="secondary"
                            size="sm"
                            type="button"
                            onClick={handleCancelRename}
                            disabled={renaming}
                          >
                            Hủy
                          </Button>
                        </div>
                      ) : (
                        <p className={styles.historyPreview}>{chat.lastMessagePreview}</p>
                      )}
                    </div>
                    <div className={styles.historyActions}>
                      <Button
                        className={styles.renameBtn}
                        variant="secondary"
                        size="sm"
                        type="button"
                        onClick={() => handleStartRename(chat)}
                        aria-label="Đổi tên hội thoại"
                        title="Đổi tên hội thoại"
                      >
                        ✎
                      </Button>
                      <Button
                        className={styles.deleteBtn}
                        variant="secondary"
                        size="sm"
                        type="button"
                        onClick={() => handleDeleteChat(chat.conversationId)}
                        aria-label="Xóa hội thoại"
                        title="Xóa hội thoại"
                      >
                        ✕
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <div className={styles.chatPanel}>
            <div className={styles.messages} ref={messagesRef}>
              {messages.length === 0 ? (
                <PageState type="empty" message="Chưa có hội thoại. Hãy gửi tin nhắn đầu tiên." />
              ) : (
                <>
                  {messages.map((msg) => (
                    <div key={msg.id} className={`${styles.message} ${styles[msg.role]}`}>
                      {msg.role === 'assistant' && <div className={styles.avatarIcon}>AI</div>}
                      <div className={styles.messageContent}>
                        {msg.role === 'assistant' && (
                          <button
                            type="button"
                            className={styles.copyBtn}
                            aria-label="Copy câu trả lời"
                            title="Copy câu trả lời"
                            onClick={() => handleCopyReply(msg.content)}
                          >
                            ⧉
                          </button>
                        )}

                        {msg.content.split('\n').map((line, idx) => (
                          <p key={`${msg.id}-${idx}`}>{line}</p>
                        ))}

                        {msg.role === 'assistant' && Array.isArray(msg.actions) && msg.actions.length > 0 && (
                          <div className={styles.feedbackRow}>
                            {msg.actions.map((action, index) => (
                              <Button
                                key={`${msg.id}-action-${index}`}
                                className={styles.smallBtn}
                                variant="secondary"
                                size="sm"
                                type="button"
                                onClick={() => handleAssistantAction(action)}
                              >
                                {action.label || 'Thực hiện'}
                              </Button>
                            ))}
                          </div>
                        )}

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
                  ))}

                  {sending && (
                    <div className={`${styles.message} ${styles.assistant}`}>
                      <div className={styles.avatarIcon}>AI</div>
                      <div className={`${styles.messageContent} ${styles.typingBubble}`}>
                        <div className={styles.waveDots}>
                          <span />
                          <span />
                          <span />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <form onSubmit={handleSubmit} className={styles.inputArea}>
              <div className={styles.inputWrapper}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className={styles.attachBtn}
                  onClick={handleUploadForAnalysis}
                >
                  Tệp
                </Button>
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
