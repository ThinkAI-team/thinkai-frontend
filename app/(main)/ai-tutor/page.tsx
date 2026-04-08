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
import { getUseHarness, setUseHarness, sendChatMessageHarness, getHarnessHistory, getUserMemory, updateUserMemory, type HarnessConversation, type ThinkingStep, type UserMemory } from '@/services/ai-harness';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sourceLogId?: number;
  rating?: number | null;
  actions?: AiTutorUiAction[];
  thinkingSteps?: ThinkingStep[];
}

const defaultSettings: AISettings = {
  language: 'English',
  responseLength: 'detailed',
  communicationStyle: 'friendly',
  correctionMode: 'balanced',
  answerFormat: 'auto',
};

const LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const TARGET_EXAM_OPTIONS = ['TOEIC', 'IELTS', 'TOEFL', 'Cambridge'] as const;
const LESSON_CONTEXT_OPTIONS = ['General English', 'Business English', 'Academic English'] as const;
const TARGET_SCORE_PRESETS = [550, 650, 750, 850, 900] as const;
const OTHER_OPTION_VALUE = '__other__';

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

  const [useHarness, setUseHarnessState] = useState(true);
  const [harnessHistory, setHarnessHistory] = useState<HarnessConversation[]>([]);
  const [showThinkingSteps, setShowThinkingSteps] = useState<{ [key: string]: boolean }>({});
  const [showHarnessNotice, setShowHarnessNotice] = useState(false);
  const [entryNoticeShown, setEntryNoticeShown] = useState(false);
  
  const [userMemory, setUserMemory] = useState<UserMemory | null>(null);
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [levelSelectValue, setLevelSelectValue] = useState<string>('');
  const [customLevel, setCustomLevel] = useState('');
  const [examSelectValue, setExamSelectValue] = useState<string>('');
  const [customExam, setCustomExam] = useState('');
  const [scoreSelectValue, setScoreSelectValue] = useState<string>('');
  const [customTargetScore, setCustomTargetScore] = useState('');
  const [contextSelectValue, setContextSelectValue] = useState<string>('');
  const [customLessonContext, setCustomLessonContext] = useState('');

  const reloadHistory = async (): Promise<AiChatConversation[]> => {
    if (useHarness) {
      const history = await getHarnessHistory();
      setHarnessHistory(history);
      return [];
    }
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
      const [tutorHistory, aiSettings] = await Promise.all([
        useHarness ? getHarnessHistory() : getChatHistory(),
        getAISettings().catch(() => defaultSettings),
      ]);
      
      if (useHarness) {
        setHarnessHistory(tutorHistory as HarnessConversation[]);
      } else {
        setChatLogs(tutorHistory as AiChatConversation[]);
      }
      
      setSettings({
        ...defaultSettings,
        ...aiSettings,
      });

      if (useHarness) {
        const harnessList = tutorHistory as HarnessConversation[];
        if (harnessList[0]) {
          setSelectedConversationId(harnessList[0].conversationId);
        } else {
          setSelectedConversationId(null);
          setMessages([]);
        }
      } else {
        const tutorList = tutorHistory as AiChatConversation[];
        if (tutorList[0]) {
          await loadChatDetail(tutorList[0].conversationId);
        } else {
          setSelectedConversationId(null);
          setMessages([]);
        }
      }
    } catch (err: any) {
      if (err instanceof ApiException && err.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setTimeout(() => router.push('/login'), 1200);
      } else {
        setError(err.message || 'Không thể tải dữ liệu BiliBily.');
      }
    } finally {
      setChatLoading(false);
    }
  }, [loadChatDetail, router, useHarness]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    setUseHarnessState(getUseHarness());
  }, []);

  useEffect(() => {
    if (useHarness) {
      getUserMemory().then(setUserMemory).catch(() => {});
    }
  }, [useHarness]);

  useEffect(() => {
    if (useHarness && !entryNoticeShown) {
      setShowHarnessNotice(true);
      setEntryNoticeShown(true);
    }
  }, [useHarness, entryNoticeShown]);

  useEffect(() => {
    const level = (userMemory?.userLevel || '').trim();
    if (!level) {
      setLevelSelectValue('');
      setCustomLevel('');
    } else if (LEVEL_OPTIONS.includes(level as (typeof LEVEL_OPTIONS)[number])) {
      setLevelSelectValue(level);
      setCustomLevel('');
    } else {
      setLevelSelectValue(OTHER_OPTION_VALUE);
      setCustomLevel(level);
    }

    const exam = (userMemory?.targetExam || '').trim();
    if (!exam) {
      setExamSelectValue('');
      setCustomExam('');
    } else if (TARGET_EXAM_OPTIONS.includes(exam as (typeof TARGET_EXAM_OPTIONS)[number])) {
      setExamSelectValue(exam);
      setCustomExam('');
    } else {
      setExamSelectValue(OTHER_OPTION_VALUE);
      setCustomExam(exam);
    }

    const lessonContext = (userMemory?.lessonContext || '').trim();
    if (!lessonContext) {
      setContextSelectValue('');
      setCustomLessonContext('');
    } else if (LESSON_CONTEXT_OPTIONS.includes(lessonContext as (typeof LESSON_CONTEXT_OPTIONS)[number])) {
      setContextSelectValue(lessonContext);
      setCustomLessonContext('');
    } else {
      setContextSelectValue(OTHER_OPTION_VALUE);
      setCustomLessonContext(lessonContext);
    }

    const targetScore = userMemory?.targetScore;
    if (!targetScore || targetScore <= 0) {
      setScoreSelectValue('');
      setCustomTargetScore('');
    } else if (TARGET_SCORE_PRESETS.includes(targetScore as (typeof TARGET_SCORE_PRESETS)[number])) {
      setScoreSelectValue(String(targetScore));
      setCustomTargetScore('');
    } else {
      setScoreSelectValue(OTHER_OPTION_VALUE);
      setCustomTargetScore(String(targetScore));
    }
  }, [userMemory]);

  const handleToggleHarness = () => {
    const newValue = !useHarness;
    setUseHarnessState(newValue);
    setUseHarness(newValue);
    if (newValue) {
      setShowHarnessNotice(true);
    }
    setNotice(newValue ? 'Đã bật AI Harness (mới)' : 'Đã bật AI Tutor (cũ)');
    // Reload history when switching
    if (newValue) {
      getHarnessHistory().then(setHarnessHistory).catch(() => {});
      setMessages([]);
      setSelectedConversationId(null);
    } else {
      getChatHistory().then(setChatLogs).catch(() => {});
      setMessages([]);
      setSelectedConversationId(null);
    }
  };

  const handleUpgradeHarness = () => {
    setShowHarnessNotice(false);
    router.push('/subscription');
  };

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

    // Add placeholder for assistant message
    const assistantMsgId = `tmp-assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        thinkingSteps: [],
      },
    ]);
    setShowThinkingSteps(prev => ({ ...prev, [assistantMsgId]: true }));

    try {
      if (useHarness) {
        const response = await sendChatMessageHarness({
          message,
          conversationId: selectedConversationId ?? undefined,
          language: settings.language,
          responseLength: settings.responseLength,
          communicationStyle: settings.communicationStyle,
          correctionMode: settings.correctionMode,
          answerFormat: settings.answerFormat,
        });
        
        // Update the assistant message with full content and thinking steps
        setMessages((prev) => prev.map(msg => 
          msg.id === assistantMsgId 
            ? { ...msg, content: response.reply, thinkingSteps: response.thinkingSteps || [] }
            : msg
        ));

        if (response.conversationId) {
          setSelectedConversationId(response.conversationId);
        }

        if (typeof response.harnessRemainingUses === 'number' && typeof response.harnessMaxUses === 'number') {
          if (response.harnessRemainingUses <= 1) {
            setNotice(
              `Bạn còn ${response.harnessRemainingUses}/${response.harnessMaxUses} lượt Harness. Vui lòng nâng cấp Pro để dùng không giới hạn.`
            );
            setShowHarnessNotice(true);
          } else {
            setNotice(`Bạn còn ${response.harnessRemainingUses}/${response.harnessMaxUses} lượt Harness.`);
          }
        }
      } else {
        const response = await sendChatMessage({
          message,
          context: selectedConversationId ? `Follow-up in conversation ${selectedConversationId}` : undefined,
          conversationId: selectedConversationId ?? undefined,
        });

        setMessages((prev) => prev.map(msg => 
          msg.id === assistantMsgId 
            ? { 
                ...msg, 
                content: response.reply,
                sourceLogId: response.messageId,
                rating: null,
                actions: response.actions || [],
              }
            : msg
        ));

        if (response.conversationId) {
          setSelectedConversationId(response.conversationId);
        }
      }
      await reloadHistory();
    } catch (err: any) {
      setError(err.message || 'Gửi tin nhắn thất bại.');
      setInputValue(message);
      // Remove placeholder on error
      setMessages((prev) => prev.filter(msg => msg.id !== assistantMsgId));
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
      setNotice('Đã ghi nhận đánh giá phản hồi của BiliBily.');
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
      setNotice('Đã cập nhật cài đặt chat.');
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật cài đặt AI.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdateMemory = async (e: FormEvent) => {
    e.preventDefault();
    if (!userMemory) return;

    try {
      setMemoryLoading(true);
      setError('');
      const updated = await updateUserMemory(userMemory);
      setUserMemory(updated);
      setNotice('Đã cập nhật bộ nhớ người dùng.');
    } catch (err: any) {
      setError(err.message || 'Khoong thể cập nhật bộ nhớ người dùng.');
    } finally {
      setMemoryLoading(false);
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
          <h1>BiliBily hỗ trợ học tập theo thời gian thực</h1>
          <p>Chat với BiliBily, quản lý cài đặt chat, hồ sơ học tập và lịch sử hội thoại.</p>
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
            <h3>Cài đặt Chat</h3>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
              Các cài đặt này được gửi vào Harness context và agent sẽ dùng trực tiếp khi trả lời.
            </p>
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
              <label>
                Văn phong
                <select
                  value={settings.communicationStyle || 'friendly'}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      communicationStyle: e.target.value,
                    }))
                  }
                >
                  <option value="friendly">Than thiện</option>
                  <option value="professional">Chuyên nghiệp</option>
                  <option value="coach">Huấn luyện</option>
                </select>
              </label>
              <label>
                Chế độ sửa lỗi
                <select
                  value={settings.correctionMode || 'balanced'}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      correctionMode: e.target.value,
                    }))
                  }
                >
                  <option value="minimal">Nhẹ</option>
                  <option value="balanced">Cân bằng</option>
                  <option value="strict">Nghiêm ngặt</option>
                </select>
              </label>
              <label>
                Định dạng trả lời
                <select
                  value={settings.answerFormat || 'auto'}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      answerFormat: e.target.value,
                    }))
                  }
                >
                  <option value="auto">Tự động</option>
                  <option value="bullet">Bullet points</option>
                  <option value="step_by_step">Từng bước</option>
                  <option value="example_first">Ví dụ trước</option>
                </select>
              </label>
            </div>
            <Button variant="primary" size="sm" type="button" onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings ? 'Đang lưu...' : 'Lưu cài đặt chat'}
            </Button>
          </div>

          {useHarness && (
            <form className={styles.utilityCard} onSubmit={handleUpdateMemory}>
              <h3>Hồ sơ học tập & Rules</h3>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                Thông tin này để agent hiểu về bạn hơn
              </p>
              <div className={styles.summaryForm} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <label style={{ fontSize: '12px' }}>
                  Level
                  <select
                    value={levelSelectValue}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setLevelSelectValue(nextValue);
                      if (nextValue === OTHER_OPTION_VALUE) {
                        const nextCustom = customLevel.trim();
                        setUserMemory(prev => (prev ? { ...prev, userLevel: nextCustom || null } : null));
                        return;
                      }
                      setCustomLevel('');
                      setUserMemory(prev => (prev ? { ...prev, userLevel: nextValue || null } : null));
                    }}
                    style={{ width: '100%', padding: '4px', marginTop: '4px' }}
                  >
                    <option value="">Để trống</option>
                    <option value="A1">A1 - Beginner</option>
                    <option value="A2">A2 - Elementary</option>
                    <option value="B1">B1 - Intermediate</option>
                    <option value="B2">B2 - Upper Intermediate</option>
                    <option value="C1">C1 - Advanced</option>
                    <option value="C2">C2 - Proficient</option>
                    <option value={OTHER_OPTION_VALUE}>Khac</option>
                  </select>
                  {levelSelectValue === OTHER_OPTION_VALUE && (
                    <input
                      type="text"
                      value={customLevel}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCustomLevel(v);
                        setUserMemory(prev => (prev ? { ...prev, userLevel: v.trim() || null } : null));
                      }}
                      placeholder="Nhap level tuy chinh"
                      style={{ width: '100%', padding: '4px', marginTop: '4px' }}
                    />
                  )}
                </label>
                <label style={{ fontSize: '12px' }}>
                  Target Exam
                  <select
                    value={examSelectValue}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setExamSelectValue(nextValue);
                      if (nextValue === OTHER_OPTION_VALUE) {
                        const nextCustom = customExam.trim();
                        setUserMemory(prev => (prev ? { ...prev, targetExam: nextCustom || null } : null));
                        return;
                      }
                      setCustomExam('');
                      setUserMemory(prev => (prev ? { ...prev, targetExam: nextValue || null } : null));
                    }}
                    style={{ width: '100%', padding: '4px', marginTop: '4px' }}
                  >
                    <option value="">Để trống</option>
                    <option value="TOEIC">TOEIC</option>
                    <option value="IELTS">IELTS</option>
                    <option value="TOEFL">TOEFL</option>
                    <option value="Cambridge">Cambridge</option>
                    <option value={OTHER_OPTION_VALUE}>Khac</option>
                  </select>
                  {examSelectValue === OTHER_OPTION_VALUE && (
                    <input
                      type="text"
                      value={customExam}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCustomExam(v);
                        setUserMemory(prev => (prev ? { ...prev, targetExam: v.trim() || null } : null));
                      }}
                      placeholder="Nhap ten ky thi tuy chinh"
                      style={{ width: '100%', padding: '4px', marginTop: '4px' }}
                    />
                  )}
                </label>
                <label style={{ fontSize: '12px' }}>
                  Target Score
                  <select
                    value={scoreSelectValue}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setScoreSelectValue(nextValue);
                      if (nextValue === OTHER_OPTION_VALUE) {
                        const parsed = parseInt(customTargetScore.trim(), 10);
                        setUserMemory(prev => (prev ? { ...prev, targetScore: Number.isNaN(parsed) ? null : parsed } : null));
                        return;
                      }
                      setCustomTargetScore('');
                      const parsed = parseInt(nextValue, 10);
                      setUserMemory(prev => (prev ? { ...prev, targetScore: Number.isNaN(parsed) ? null : parsed } : null));
                    }}
                    style={{ width: '100%', padding: '4px', marginTop: '4px' }}
                  >
                    <option value="">Để trống</option>
                    {TARGET_SCORE_PRESETS.map((score) => (
                      <option key={score} value={score}>{score}</option>
                    ))}
                    <option value={OTHER_OPTION_VALUE}>Khac</option>
                  </select>
                  {scoreSelectValue === OTHER_OPTION_VALUE && (
                    <input
                      type="number"
                      value={customTargetScore}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setCustomTargetScore(raw);
                        const parsed = parseInt(raw.trim(), 10);
                        setUserMemory(prev => (prev
                          ? { ...prev, targetScore: Number.isNaN(parsed) ? null : parsed }
                          : null
                        ));
                      }}
                      style={{ width: '100%', padding: '4px', marginTop: '4px' }}
                      placeholder="Nhap target score tuy chinh"
                    />
                  )}
                </label>
                <label style={{ fontSize: '12px' }}>
                  Lesson Context
                  <select
                    value={contextSelectValue}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setContextSelectValue(nextValue);
                      if (nextValue === OTHER_OPTION_VALUE) {
                        const nextCustom = customLessonContext.trim();
                        setUserMemory(prev => (prev ? { ...prev, lessonContext: nextCustom || undefined } : null));
                        return;
                      }
                      setCustomLessonContext('');
                      setUserMemory(prev => (prev ? { ...prev, lessonContext: nextValue || undefined } : null));
                    }}
                    style={{ width: '100%', padding: '4px', marginTop: '4px' }}
                  >
                    <option value="">Để trống</option>
                    <option value="General English">General English</option>
                    <option value="Business English">Business English</option>
                    <option value="Academic English">Academic English</option>
                    <option value={OTHER_OPTION_VALUE}>Khac</option>
                  </select>
                  {contextSelectValue === OTHER_OPTION_VALUE && (
                    <input
                      type="text"
                      value={customLessonContext}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCustomLessonContext(v);
                        setUserMemory(prev => (prev ? { ...prev, lessonContext: v.trim() || undefined } : null));
                      }}
                      placeholder="Nhap lesson context tuy chinh"
                      style={{ width: '100%', padding: '4px', marginTop: '4px' }}
                    />
                  )}
                </label>
                <label style={{ fontSize: '12px', gridColumn: '1 / -1' }}>
                  Điểm yếu (Phân cách bởi dấu phẩy)
                  <input
                    type="text"
                    value={userMemory?.weakPoints || ''}
                    onChange={(e) => setUserMemory(prev => prev ? { ...prev, weakPoints: e.target.value } : null)}
                    placeholder="grammar, vocabulary, listening..."
                    style={{ width: '100%', padding: '4px', marginTop: '4px' }}
                  />
                </label>
                <label style={{ fontSize: '12px', gridColumn: '1 / -1' }}>
                  Điểm mạnh (Phân cách bởi dấu phẩy)
                  <input
                    type="text"
                    value={userMemory?.strongPoints || ''}
                    onChange={(e) => setUserMemory(prev => prev ? { ...prev, strongPoints: e.target.value } : null)}
                    placeholder="speaking, reading..."
                    style={{ width: '100%', padding: '4px', marginTop: '4px' }}
                  />
                </label>
                <label style={{ fontSize: '12px', gridColumn: '1 / -1' }}>
                  Adaptive Rules (tuỳ chỉnh)
                  <textarea
                    value={userMemory?.adaptiveRules || ''}
                    onChange={(e) => setUserMemory(prev => prev ? { ...prev, adaptiveRules: e.target.value || null } : null)}
                    placeholder="VD: Uu tien sua loi ngu phap truoc; Giai thich ngan gon, co vi du tieng Viet."
                    rows={3}
                    style={{ width: '100%', padding: '6px', marginTop: '4px', resize: 'vertical' }}
                  />
                </label>
              </div>
              <Button variant="primary" size="sm" type="submit" disabled={memoryLoading} style={{ marginTop: '8px' }}>
                {memoryLoading ? 'Dang luu...' : 'Lưu bộ nhớ'}
              </Button>
            </form>
          )}

          {!useHarness && (
            <form className={styles.utilityCard} onSubmit={handleSummarize}>
              <h3>Tom tat bai hoc</h3>
              <div className={styles.summaryForm}>
                <textarea
                  placeholder="Dan transcript hoac noi dung bai hoc can tom tat..."
                  value={summaryContent}
                  onChange={(e) => setSummaryContent(e.target.value)}
                  rows={4}
                />
                <Button variant="primary" size="sm" type="submit" disabled={summaryLoading}>
                  {summaryLoading ? 'Dang tom tat...' : 'Tao tom tat'}
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
          )}
        </section>

        <section className={styles.chatLayout}>
          <aside className={styles.historyPanel}>
            <div className={styles.historyHeader}>
              <h3>Lịch sử chat</h3>
              <Button variant="secondary" size="sm" type="button" onClick={handleCreateNewChat}>
                + Mới
              </Button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={handleToggleHarness}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: useHarness ? 'bold' : 'normal',
                  background: useHarness ? '#4CAF50' : '#bbb',
                  color: useHarness ? 'white' : '#333',
                }}
              >
                Harness
              </button>
              <button
                type="button"
                onClick={handleToggleHarness}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: !useHarness ? 'bold' : 'normal',
                  background: !useHarness ? '#FF9800' : '#bbb',
                  color: !useHarness ? 'white' : '#333',
                }}
              >
                Tutor
              </button>
            </div>

            {chatLoading ? (
              <PageState type="loading" message="Đang tải lịch sử hội thoại..." />
            ) : useHarness ? (
              harnessHistory.length === 0 ? (
                <PageState type="empty" message="Chưa có hội thoại Harness." />
              ) : (
                <ul className={styles.historyList}>
                  {harnessHistory.map((chat) => (
                    <li key={chat.conversationId} className={styles.historyItem}>
                      <div className={styles.historyMain}>
                        <Button
                          variant="secondary"
                          size="sm"
                          type="button"
                          className={`${styles.historyLink} ${selectedConversationId === chat.conversationId ? styles.historyActive : ''}`}
                          aria-current={selectedConversationId === chat.conversationId ? 'true' : undefined}
                          onClick={() => setSelectedConversationId(chat.conversationId)}
                        >
                          <span>{chat.title || 'Cuộc trò chuyện mới'}</span>
                          <small>{chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleString('vi-VN') : ''}</small>
                        </Button>
                        <p className={styles.historyPreview}>{chat.lastMessagePreview}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )
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

                        {msg.role === 'assistant' && msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                          <div style={{ marginTop: '12px', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setShowThinkingSteps(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#666',
                                fontSize: '12px',
                                cursor: 'pointer',
                                padding: '4px 0',
                              }}
                            >
                              {showThinkingSteps[msg.id] ? '▲ Ẩn quá trình xử lý' : '▼ Xem quá trình xử lý'}
                            </button>
                            
                            {showThinkingSteps[msg.id] && (
                              <div style={{
                                background: '#ced4da',
                                borderRadius: '6px',
                                padding: '10px',
                                marginTop: '8px',
                                fontSize: '12px',
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#212529' }}>
                                  Quá trình xu li
                                </div>
                                {msg.thinkingSteps.map((step, index) => (
                                  <div
                                    key={index}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      gap: '8px',
                                      padding: '6px 0',
                                      borderBottom: index < msg.thinkingSteps!.length - 1 ? '1px solid #adb5bd' : 'none',
                                    }}
                                  >
                                    <span style={{ 
                                      color: step.success ? '#198754' : '#dc3545', 
                                      fontWeight: 'bold',
                                      minWidth: '20px' 
                                    }}>
                                      {step.success ? '1' : '0'}
                                    </span>
                                    <span style={{ fontWeight: '600', color: '#212529', minWidth: '90px' }}>{step.step}</span>
                                    <span style={{ color: '#495057', flex: 1 }}>{step.description}</span>
                                    <span style={{ color: '#6c757d', fontSize: '11px' }}>{step.latencyMs}ms</span>
                                  </div>
                                ))}
                              </div>
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

        {showHarnessNotice && (
          <div
            className={styles.harnessNoticeOverlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="harness-notice-title"
            onClick={() => setShowHarnessNotice(false)}
          >
            <div className={styles.harnessNoticeBox} onClick={(e) => e.stopPropagation()}>
              <span className={styles.harnessNoticeBadge}>Harness Beta</span>
              <h3 id="harness-notice-title">Thông báo sử dụng Harness</h3>
              <p className={styles.harnessNoticeDesc}>
                Harness hiện tại đang được sử dụng miễn phí. Sau ngày <strong>15/04/2026</strong> sẽ bắt đầu tính phí <strong>1$/tháng</strong>.
              </p>
              <div className={styles.harnessNoticeActions}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowHarnessNotice(false)}
                >
                  Đóng
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleUpgradeHarness}
                >
                  Nâng cấp
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
