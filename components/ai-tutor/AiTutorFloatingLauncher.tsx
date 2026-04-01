'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { 
  sendChatMessage, 
  uploadAiTutorFile, 
  type AiTutorUiAction,
  getPendingAction,
  confirmPendingAction,
  cancelPendingAction,
  type AgentType
} from '@/services/ai-tutor';
import styles from './AiTutorFloatingLauncher.module.css';

const AGENT_NAMES: Record<AgentType, string> = {
  TUTOR: 'Gia sư',
  LEARNING: 'Học tập',
  COURSE_OPS: 'Quản lý',
  EXAM_OPS: 'Thi cử',
  SAFETY_POLICY: 'An toàn'
};

const HIDDEN_PATH_PREFIXES = ['/login', '/register', '/forgot-password', '/reset-password'];
const CONVERSATION_STORAGE_KEY = 'botrang_floating_conversation_id';

interface FloatingMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: AiTutorUiAction[];
  agentType?: AgentType;
}

export default function AiTutorFloatingLauncher() {
  const pathname = usePathname();
  const messageBoxRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<FloatingMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Xin chào, mình là Bò Trang. Bạn cần mình hỗ trợ học TOEIC/IELTS gì ngay lúc này?',
    },
  ]);
  const [currentAgent, setCurrentAgent] = useState<string>('TUTOR');
  const [pendingAction, setPendingAction] = useState<{
    id: number;
    action: string;
    expiresAt: string;
  } | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [missingField, setMissingField] = useState<string | null>(null);
  const [fieldInputValue, setFieldInputValue] = useState('');

  useEffect(() => {
    const syncAuth = () => {
      const token = localStorage.getItem('thinkai_access_token');
      setIsAuthenticated(Boolean(token));
    };

    syncAuth();
    setConversationId(localStorage.getItem(CONVERSATION_STORAGE_KEY));
    setIsReady(true);
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  useEffect(() => {
    if (!conversationId) {
      localStorage.removeItem(CONVERSATION_STORAGE_KEY);
      return;
    }
    localStorage.setItem(CONVERSATION_STORAGE_KEY, conversationId);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !isOpen) return;
    
    const checkPending = async () => {
      try {
        const pending = await getPendingAction(conversationId);
        if (pending && pending.status === 'PENDING') {
          setPendingAction({
            id: pending.id,
            action: pending.action,
            expiresAt: pending.expiresAt
          });
        } else {
          setPendingAction(null);
        }
      } catch {
        // ignore errors
      }
    };
    
    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, [conversationId, isOpen]);

  useEffect(() => {
    const box = messageBoxRef.current;
    if (!box) return;
    box.scrollTop = box.scrollHeight;
  }, [messages, sending, isOpen]);

  if (!isReady || !isAuthenticated || !pathname) {
    return null;
  }

  if (pathname.startsWith('/ai-tutor')) {
    return null;
  }

  if (HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const handleCreateNewChat = () => {
    setConversationId(null);
    setNotice('');
    setError('');
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: 'Mình đã tạo đoạn chat mới. Bạn muốn Bò Trang giúp gì tiếp theo?',
      },
    ]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const message = inputValue.trim();
    if (!message || sending) {
      return;
    }

    setNotice('');
    setError('');
    setSending(true);
    setInputValue('');
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
      },
    ]);

    try {
      const response = await sendChatMessage({
        message,
        conversationId: conversationId ?? undefined,
        context: conversationId ? `Follow-up in conversation ${conversationId}` : undefined,
      });
      console.log('>>> RESPONSE received:', response);
      
      if (response.conversationId) {
        setConversationId(response.conversationId);
      }
      
      const agent = response.agentType || 'TUTOR';
      setCurrentAgent(agent);
      
      // Handle needsMoreInfo - show form input
      if (response.needsMoreInfo && response.missingField) {
        setMissingField(response.missingField);
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: response.reply,
          },
        ]);
        return;
      }
      
      setMissingField(null);
      setFieldInputValue('');
      
      setMessages((prev) => [
        ...prev,
        {
          id: response.messageId ? `assistant-${response.messageId}` : `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.reply,
          actions: response.actions || [],
        },
      ]);
    } catch (error: any) {
      console.error('>>> ERROR in handleSubmit:', error);
      setError(error?.message || 'Không thể gửi tin nhắn.');
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: error?.message || 'Mình chưa trả lời được lúc này, bạn thử lại giúp mình nhé.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleUploadForAnalysis = async () => {
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = 'image/*,.pdf,.txt,.md,.doc,.docx,.mp4,.mp3';
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
        setError(err?.message || 'Không thể upload file.');
      }
    };
    picker.click();
  };

  const handleAssistantAction = (action: AiTutorUiAction) => {
    if (action.type !== 'UPLOAD_FILE') {
      return;
    }
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
        setError(err?.message || 'Không thể upload file.');
      }
    };
    picker.click();
  };

  const handleCopyReply = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setNotice('Đã copy câu trả lời của Bò Trang.');
      setError('');
    } catch {
      setError('Không thể copy. Trình duyệt chưa cấp quyền clipboard.');
    }
  };

  const handleConfirmAction = async () => {
    if (!conversationId || processingAction) return;
    setProcessingAction(true);
    try {
      const result = await confirmPendingAction(conversationId);
      if (result.success) {
        setNotice(result.message);
        setMessages(prev => [...prev, {
          id: `action-confirmed-${Date.now()}`,
          role: 'assistant',
          content: `✅ ${result.message}`
        }]);
      } else {
        setError(result.message);
      }
      setPendingAction(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể xác nhận thao tác.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSubmitWithField = async () => {
    if (!fieldInputValue.trim() || sending) return;
    
    const originalMessage = inputValue;
    const enhancedMessage = `${originalMessage} ${missingField}:${fieldInputValue}`;
    
    setInputValue(enhancedMessage);
    setMissingField(null);
    setFieldInputValue('');
    
    // Trigger submit with the enhanced message
    const form = document.querySelector('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    }
  };

  const handleCancelAction = async () => {
    if (!conversationId || processingAction) return;
    setProcessingAction(true);
    try {
      await cancelPendingAction(conversationId);
      setNotice('Đã hủy thao tác.');
      setMessages(prev => [...prev, {
        id: `action-cancelled-${Date.now()}`,
        role: 'assistant',
        content: '❌ Thao tác đã bị hủy.'
      }]);
      setPendingAction(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể hủy thao tác.');
    } finally {
      setProcessingAction(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {isOpen && (
        <section className={styles.panel} aria-label="Bò Trang chat widget">
          <header className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <strong>Bò Trang</strong>
              <span>Gia sư TOEIC/IELTS</span>
              <span className={styles.agentBadge} style={{display: 'inline-block'}}>
                Agent: {currentAgent}
              </span>
            </div>
            <div className={styles.panelActions}>
              <button type="button" className={styles.headerBtn} onClick={handleCreateNewChat}>
                Mới
              </button>
              <button type="button" className={styles.headerBtn} onClick={() => setIsOpen(false)} aria-label="Thu gọn chat">
                ×
              </button>
            </div>
          </header>

          <div className={styles.messages} ref={messageBoxRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.messageRow} ${message.role === 'user' ? styles.userRow : styles.assistantRow}`}
              >
                <div className={styles.bubble}>
                  {message.role === 'assistant' && (
                    <button
                      type="button"
                      className={styles.copyBtn}
                      aria-label="Copy câu trả lời"
                      title="Copy câu trả lời"
                      onClick={() => handleCopyReply(message.content)}
                    >
                      ⧉
                    </button>
                  )}
                  {message.content.split('\n').map((line, index) => (
                    <p key={`${message.id}-${index}`}>{line}</p>
                  ))}
                  {message.role === 'assistant' && Array.isArray(message.actions) && message.actions.length > 0 && (
                    <div className={styles.actionRow}>
                      {message.actions.map((action, index) => (
                        <button
                          key={`${message.id}-action-${index}`}
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => handleAssistantAction(action)}
                        >
                          {action.label || 'Thực hiện'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {pendingAction && (
              <div className={styles.pendingActionBox}>
                <p>
                  <strong>⚠️ Xác nhận thao tác</strong>
                  <br />
                  Bạn có muốn thực hiện "{pendingAction.action}" không?
                </p>
                <div className={styles.pendingActionButtons}>
                  <button 
                    type="button" 
                    className={styles.confirmBtn}
                    onClick={handleConfirmAction}
                    disabled={processingAction}
                  >
                    ✅ Xác nhận
                  </button>
                  <button 
                    type="button" 
                    className={styles.cancelBtn}
                    onClick={handleCancelAction}
                    disabled={processingAction}
                  >
                    ❌ Hủy
                  </button>
                </div>
              </div>
            )}

            {missingField && (
              <div className={styles.pendingActionBox}>
                <p>
                  <strong>📝 Cần thêm thông tin</strong>
                  <br />
                  {fieldInputValue || 'Nhập thông tin bên dưới:'}
                </p>
                <div className={styles.pendingActionButtons}>
                  <input
                    style={{flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}}
                    value={fieldInputValue}
                    onChange={(e) => setFieldInputValue(e.target.value)}
                    placeholder={`Nhập ${missingField}...`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmitWithField();
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {sending && (
              <div className={`${styles.messageRow} ${styles.assistantRow}`}>
                <div className={`${styles.bubble} ${styles.typingBubble}`}>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>

          {notice && <p className={styles.notice}>{notice}</p>}
          {error && <p className={styles.error}>{error}</p>}

          <form className={styles.panelInput} onSubmit={handleSubmit}>
            <button type="button" className={styles.attachBtn} onClick={handleUploadForAnalysis} disabled={sending}>
              Tệp
            </button>
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Nhắn Bò Trang..."
              disabled={sending}
            />
            <button type="submit" className={styles.sendBtn} disabled={sending || !inputValue.trim()}>
              Gửi
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className={`${styles.button} ${isOpen ? styles.buttonActive : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Thu gọn Bò Trang' : 'Mở Bò Trang'}
        title={isOpen ? 'Thu gọn Bò Trang' : 'Mở Bò Trang'}
      >
        <span className={styles.pulse} aria-hidden="true" />
        <span className={styles.label}>Bò</span>
      </button>
    </div>
  );
}
