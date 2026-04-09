'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import PageState from '@/components/ui/PageState';
import { ApiException } from '@/services/api';
import { logout } from '@/services/auth';
import { sendChatMessage } from '@/services/ai-tutor';
import { getProfile, type ProfileResponse } from '@/services/user';
import {
  createTeacherQuestion,
  getTeacherQuestionBank,
  getTeacherQuestionDetail,
  importTeacherQuestions,
  type QuestionBankRequest,
  type TeacherQuestionBank,
} from '@/services/teacher';
import dashboardStyles from '../../(main)/dashboard/page.module.css';
import styles from '../page.module.css';
import TeacherShell from '../components/TeacherShell';

const defaultQuestionForm: QuestionBankRequest = {
  examType: 'TOEIC',
  section: 'READING',
  part: 'PART_5',
  content: '',
  options: '["A","B","C","D"]',
  correctAnswer: '',
  explanation: '',
  difficulty: 'EASY',
  tags: [],
};

interface QuestionTutorSuggestion {
  examType?: string;
  section?: string;
  part?: string;
  content?: string;
  options?: string;
  correctAnswer?: string;
  explanation?: string;
  difficulty?: QuestionBankRequest['difficulty'];
  tags?: string[];
}

export default function TeacherQuestionsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [questions, setQuestions] = useState<TeacherQuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [questionForm, setQuestionForm] = useState(defaultQuestionForm);
  const [questionTagsInput, setQuestionTagsInput] = useState('');
  const [questionImportFile, setQuestionImportFile] = useState<File | null>(null);
  const [selectedQuestionDetail, setSelectedQuestionDetail] = useState<TeacherQuestionBank | null>(null);
  const [tutorSummary, setTutorSummary] = useState('');
  const [tutorSummaryLoading, setTutorSummaryLoading] = useState(false);
  const [tutorSummaryError, setTutorSummaryError] = useState('');
  const [tutorSuggestion, setTutorSuggestion] = useState<QuestionTutorSuggestion | null>(null);
  const showBlockingLoading = loading && questions.length === 0;

  const tryParseTutorSuggestion = (raw: string): QuestionTutorSuggestion | null => {
    const jsonBlockMatch = raw.match(/```json\s*([\s\S]*?)```/i);
    const candidate = jsonBlockMatch?.[1] || raw;
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start < 0 || end < 0 || end <= start) return null;
    try {
      const parsed = JSON.parse(candidate.slice(start, end + 1));
      return parsed && typeof parsed === 'object' ? (parsed as QuestionTutorSuggestion) : null;
    } catch {
      return null;
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const profileData = await getProfile();
      const normalizedRole = (profileData.role || '').replace(/^ROLE_/, '').toUpperCase();
      setProfile(profileData);

      if (normalizedRole === 'STUDENT') {
        router.replace('/dashboard');
        return;
      }
      if (normalizedRole === 'ADMIN') {
        router.replace('/admin');
        return;
      }

      const questionPage = await getTeacherQuestionBank(0, 20);
      setQuestions(questionPage.content || []);
    } catch (err: any) {
      if (err instanceof ApiException && err.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setTimeout(() => router.push('/login'), 1200);
      } else {
        setError(err.message || 'Không thể tải question bank.');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleCreateQuestion = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      await createTeacherQuestion({
        ...questionForm,
        tags: questionTagsInput
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      setNotice('Đã tạo câu hỏi mới.');
      setQuestionForm(defaultQuestionForm);
      setQuestionTagsInput('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Không thể tạo câu hỏi.');
    }
  };

  const handleImportQuestions = async () => {
    setError('');
    setNotice('');
    if (!questionImportFile) {
      setError('Vui lòng chọn file CSV để import.');
      return;
    }
    try {
      const result = await importTeacherQuestions(questionImportFile);
      setNotice(`${result.message} (${result.count} câu hỏi)`);
      setQuestionImportFile(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Không thể import câu hỏi.');
    }
  };

  const handleLoadQuestionDetail = async (questionId: number) => {
    setError('');
    setNotice('');
    try {
      const detail = await getTeacherQuestionDetail(questionId);
      setSelectedQuestionDetail(detail);
      setNotice(`Đã tải chi tiết câu hỏi #${questionId}`);
    } catch (err: any) {
      setError(err.message || 'Không thể tải chi tiết câu hỏi.');
    }
  };

  const handleGenerateTutorSummary = async () => {
    setTutorSummaryLoading(true);
    setTutorSummaryError('');
    setTutorSuggestion(null);
    try {
      const contextPayload = {
        page: 'teacher-questions',
        questionForm,
        questionTagsInput,
        selectedQuestionDetail: selectedQuestionDetail
          ? {
              id: selectedQuestionDetail.id,
              examType: selectedQuestionDetail.examType,
              section: selectedQuestionDetail.section,
              part: selectedQuestionDetail.part,
              difficulty: selectedQuestionDetail.difficulty,
            }
          : null,
        questionListSample: questions.slice(0, 25).map((question) => ({
          id: question.id,
          examType: question.examType,
          section: question.section,
          part: question.part,
          difficulty: question.difficulty,
          content: question.content?.slice(0, 120),
        })),
      };

      const response = await sendChatMessage({
        message:
          'Hãy tóm tắt tình trạng ngân hàng câu hỏi hiện tại và đề xuất 10 câu hỏi mới cần bổ sung để cân bằng độ khó/chủ đề. Trả lời tiếng Việt theo 3 phần: (1) Tóm tắt, (2) Lỗ hổng coverage, (3) Câu hỏi gợi ý. Cuối cùng thêm khối ```json``` theo schema {"examType":"TOEIC","section":"READING","part":"PART_5","content":"","options":"[\\"A\\",\\"B\\",\\"C\\",\\"D\\"]","correctAnswer":"A","explanation":"","difficulty":"MEDIUM","tags":["grammar"]} để frontend tự điền form.',
        context: JSON.stringify(contextPayload),
      });
      const rawReply = response.reply || 'Chưa có phản hồi từ Tutor.';
      setTutorSummary(rawReply);
      setTutorSuggestion(tryParseTutorSuggestion(rawReply));
    } catch (err: any) {
      setTutorSummaryError(err.message || 'Không thể tạo Tutor Summary lúc này.');
    } finally {
      setTutorSummaryLoading(false);
    }
  };

  const applyTutorSuggestion = () => {
    if (!tutorSuggestion) return;
    setQuestionForm((prev) => ({
      ...prev,
      examType: tutorSuggestion.examType || prev.examType,
      section: tutorSuggestion.section || prev.section,
      part: tutorSuggestion.part || prev.part,
      content: tutorSuggestion.content || prev.content,
      options: tutorSuggestion.options || prev.options,
      correctAnswer: tutorSuggestion.correctAnswer || prev.correctAnswer,
      explanation: tutorSuggestion.explanation || prev.explanation,
      difficulty: (tutorSuggestion.difficulty as QuestionBankRequest['difficulty']) || prev.difficulty,
      tags: Array.isArray(tutorSuggestion.tags) ? tutorSuggestion.tags : prev.tags,
    }));
    if (Array.isArray(tutorSuggestion.tags)) {
      setQuestionTagsInput(tutorSuggestion.tags.join(', '));
    }
    setNotice('Đã áp dụng gợi ý từ Tutor vào form câu hỏi.');
  };

  return (
    <TeacherShell
      profile={profile}
      activeNav="questions"
      title="Ngân hàng câu hỏi"
      subtitle="Quản lý ngân hàng câu hỏi, import CSV và xem chi tiết từ teacher endpoints."
      onRefreshAction={loadData}
      onLogoutAction={handleLogout}
      notice={notice}
      error={error}
      rightSidebar={(
        <div className={dashboardStyles.lessonList}>
          <h3>Thông tin nhanh</h3>
          <p className={dashboardStyles.lessonCourse}>Tổng: {questions.length} câu hỏi</p>
          <div className={styles.kpiList}>
            <div className={styles.kpiRow}>
              <span>Mức độ EASY</span>
              <strong>{questions.filter((q) => q.difficulty === 'EASY').length}</strong>
            </div>
            <div className={styles.kpiRow}>
              <span>Mức độ MEDIUM</span>
              <strong>{questions.filter((q) => q.difficulty === 'MEDIUM').length}</strong>
            </div>
            <div className={styles.kpiRow}>
              <span>Mức độ HARD</span>
              <strong>{questions.filter((q) => q.difficulty === 'HARD').length}</strong>
            </div>
          </div>
        </div>
      )}
    >
      {showBlockingLoading ? (
        <PageState
          type="loading"
          title="Đang tải ngân hàng câu hỏi"
          message="Hệ thống đang đồng bộ ngân hàng câu hỏi giảng viên."
        />
      ) : (
        <>
          <div className={`${styles.panel} ${styles.summaryPanel}`}>
            <div className={styles.summaryHeader}>
              <h3>Tutor Summary</h3>
              <div className={styles.row}>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={handleGenerateTutorSummary}
                  disabled={tutorSummaryLoading}
                >
                  {tutorSummaryLoading ? 'Đang tổng hợp...' : 'Tạo summary'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  className={styles.primaryBtn}
                  onClick={applyTutorSuggestion}
                  disabled={!tutorSuggestion}
                >
                  Áp dụng gợi ý
                </Button>
              </div>
            </div>
            {tutorSummaryError ? (
              <p className={styles.error}>{tutorSummaryError}</p>
            ) : tutorSummary ? (
              <div className={styles.summaryContent}>{tutorSummary}</div>
            ) : (
              <p className={styles.muted}>
                Bấm "Tạo summary" để Tutor đọc toàn bộ dữ liệu trang và đề xuất bộ câu hỏi cần bổ sung.
              </p>
            )}
          </div>
          <section className={styles.columns}>
            <div className={styles.panel}>
            <h3>Tạo câu hỏi mới</h3>
            <form onSubmit={handleCreateQuestion} className={styles.form}>
              <div className={styles.row}>
                <input
                  placeholder="Exam type"
                  value={questionForm.examType}
                  onChange={(e) => setQuestionForm((prev) => ({ ...prev, examType: e.target.value }))}
                />
                <input
                  placeholder="Section"
                  value={questionForm.section}
                  onChange={(e) => setQuestionForm((prev) => ({ ...prev, section: e.target.value }))}
                />
                <input
                  placeholder="Part"
                  value={questionForm.part}
                  onChange={(e) => setQuestionForm((prev) => ({ ...prev, part: e.target.value }))}
                />
              </div>
              <textarea
                placeholder="Nội dung câu hỏi"
                value={questionForm.content}
                onChange={(e) => setQuestionForm((prev) => ({ ...prev, content: e.target.value }))}
                rows={4}
                required
              />
              <input
                placeholder='Options JSON ví dụ ["A","B","C","D"]'
                value={questionForm.options || ''}
                onChange={(e) => setQuestionForm((prev) => ({ ...prev, options: e.target.value }))}
              />
              <input
                placeholder="Đáp án đúng"
                value={questionForm.correctAnswer}
                onChange={(e) => setQuestionForm((prev) => ({ ...prev, correctAnswer: e.target.value }))}
                required
              />
              <textarea
                placeholder="Giải thích"
                value={questionForm.explanation || ''}
                onChange={(e) => setQuestionForm((prev) => ({ ...prev, explanation: e.target.value }))}
                rows={2}
              />
              <div className={styles.row}>
                <select
                  value={questionForm.difficulty}
                  onChange={(e) =>
                    setQuestionForm((prev) => ({
                      ...prev,
                      difficulty: e.target.value as QuestionBankRequest['difficulty'],
                    }))
                  }
                >
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </select>
                <input
                  placeholder="Tags (phân tách bằng dấu phẩy)"
                  value={questionTagsInput}
                  onChange={(e) => setQuestionTagsInput(e.target.value)}
                />
              </div>
              <Button variant="primary" size="sm" type="submit" className={styles.primaryBtn}>
                Tạo câu hỏi
              </Button>
            </form>

            <hr className={styles.divider} />

            <h3>Import câu hỏi từ CSV</h3>
            <div className={styles.uploadArea}>
              <input type="file" accept=".csv" onChange={(e) => setQuestionImportFile(e.target.files?.[0] || null)} />
              <Button
                variant="primary"
                size="sm"
                type="button"
                className={styles.primaryBtn}
                onClick={handleImportQuestions}
              >
                Import
              </Button>
            </div>
          </div>

          <div className={styles.panel}>
            <h3>Ngân hàng câu hỏi</h3>
            {questions.length === 0 ? (
              <PageState
                type="empty"
                message="Chưa có câu hỏi trong ngân hàng. Bạn có thể tạo mới hoặc import từ CSV."
                actionLabel="Tải lại"
                onAction={loadData}
              />
            ) : (
              <div className={styles.list}>
                {questions.map((question) => (
                  <article key={question.id} className={styles.listItem}>
                    <strong>#{question.id} {question.part}</strong>
                    <p>{question.content}</p>
                    <small>
                      {question.examType} • {question.section} • {question.difficulty}
                    </small>
                    <div className={styles.listAction}>
                      <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() => handleLoadQuestionDetail(question.id)}
                      >
                        Xem chi tiết
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {selectedQuestionDetail && (
              <article className={`${styles.listItem} ${styles.detailCard}`}>
                <strong>Chi tiết câu hỏi #{selectedQuestionDetail.id}</strong>
                <p>{selectedQuestionDetail.content}</p>
                <small>
                  Correct answer: {selectedQuestionDetail.correctAnswer || 'N/A'} • Difficulty:{' '}
                  {selectedQuestionDetail.difficulty || 'N/A'}
                </small>
              </article>
            )}
          </div>
          </section>
        </>
      )}
    </TeacherShell>
  );
}
