'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import {
  createTeacherCourse,
  createTeacherExam,
  createTeacherLesson,
  createTeacherQuestion,
  deleteTeacherCourse,
  getTeacherCourse,
  getTeacherCourses,
  getTeacherDashboard,
  getTeacherExams,
  getTeacherQuestionBank,
  getTeacherQuestionDetail,
  importTeacherQuestions,
  publishTeacherCourse,
  reorderTeacherLessons,
  updateTeacherCourse,
  uploadTeacherLessonFile,
  type ExamRequest,
  type LessonRequest,
  type QuestionBankRequest,
  type TeacherCourse,
  type TeacherDashboardStats,
  type TeacherExam,
  type TeacherQuestionBank,
} from '@/services/teacher';

type TabId = 'dashboard' | 'courses' | 'questions' | 'exams';

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'courses', label: 'Khóa học' },
  { id: 'questions', label: 'Question Bank' },
  { id: 'exams', label: 'Bài thi' },
];

const defaultCourseForm = {
  title: '',
  description: '',
  thumbnailUrl: '',
  price: 0,
};

const defaultLessonForm = {
  courseId: 0,
  title: '',
  type: 'VIDEO' as LessonRequest['type'],
  contentUrl: '',
  contentText: '',
  durationSeconds: 0,
  orderIndex: 1,
};

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

const defaultExamForm = {
  courseId: 0,
  title: '',
  examType: 'TOEIC',
  description: '',
  timeLimitMinutes: 120,
  passingScore: 60,
  isRandomOrder: true,
  partConfigJson: '{"PART_1":6,"PART_2":25,"PART_5":30}',
};

export default function TeacherPage() {
  const [tab, setTab] = useState<TabId>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [stats, setStats] = useState<TeacherDashboardStats | null>(null);
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [questions, setQuestions] = useState<TeacherQuestionBank[]>([]);
  const [exams, setExams] = useState<TeacherExam[]>([]);

  const [courseForm, setCourseForm] = useState(defaultCourseForm);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [lessonForm, setLessonForm] = useState(defaultLessonForm);
  const [lessonFile, setLessonFile] = useState<File | null>(null);
  const [lessonOrderJson, setLessonOrderJson] = useState('[{"lessonId":1,"orderIndex":1}]');
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<TeacherCourse | null>(null);

  const [questionForm, setQuestionForm] = useState(defaultQuestionForm);
  const [questionTagsInput, setQuestionTagsInput] = useState('');
  const [questionImportFile, setQuestionImportFile] = useState<File | null>(null);
  const [selectedQuestionDetail, setSelectedQuestionDetail] = useState<TeacherQuestionBank | null>(null);

  const [examForm, setExamForm] = useState(defaultExamForm);

  const courseOptions = useMemo(
    () =>
      courses.map((course) => ({
        id: course.id,
        title: course.title,
      })),
    [courses]
  );

  const fetchDashboard = useCallback(async () => {
    const data = await getTeacherDashboard();
    setStats(data);
  }, []);

  const fetchCourses = useCallback(async () => {
    const data = await getTeacherCourses(0, 20);
    setCourses(data.content);
  }, []);

  const fetchQuestions = useCallback(async () => {
    const data = await getTeacherQuestionBank(0, 20);
    setQuestions(data.content);
  }, []);

  const fetchExams = useCallback(async () => {
    const data = await getTeacherExams(0, 20);
    setExams(data.content);
  }, []);

  const loadTabData = useCallback(async (nextTab: TabId) => {
    setLoading(true);
    setError('');
    try {
      if (nextTab === 'dashboard') await fetchDashboard();
      if (nextTab === 'courses') await fetchCourses();
      if (nextTab === 'questions') await fetchQuestions();
      if (nextTab === 'exams') {
        await Promise.all([fetchCourses(), fetchExams()]);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu Teacher Portal.');
    } finally {
      setLoading(false);
    }
  }, [fetchCourses, fetchDashboard, fetchExams, fetchQuestions]);

  useEffect(() => {
    loadTabData(tab);
  }, [loadTabData, tab]);

  const resetCourseForm = () => {
    setCourseForm(defaultCourseForm);
    setEditingCourseId(null);
  };

  const handleSubmitCourse = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      if (editingCourseId) {
        await updateTeacherCourse(editingCourseId, {
          title: courseForm.title,
          description: courseForm.description,
          thumbnailUrl: courseForm.thumbnailUrl || undefined,
          price: Number(courseForm.price),
        });
        setNotice('Đã cập nhật khóa học.');
      } else {
        await createTeacherCourse({
          title: courseForm.title,
          description: courseForm.description,
          thumbnailUrl: courseForm.thumbnailUrl || undefined,
          price: Number(courseForm.price),
        });
        setNotice('Đã tạo khóa học mới.');
      }
      resetCourseForm();
      await fetchCourses();
    } catch (err: any) {
      setError(err.message || 'Không thể lưu khóa học.');
    }
  };

  const handleEditCourse = (course: TeacherCourse) => {
    setEditingCourseId(course.id);
    setCourseForm({
      title: course.title || '',
      description: course.description || '',
      thumbnailUrl: course.thumbnailUrl || '',
      price: Number(course.price) || 0,
    });
  };

  const handleDeleteCourse = async (courseId: number) => {
    try {
      await deleteTeacherCourse(courseId);
      setCourses((prev) => prev.filter((item) => item.id !== courseId));
      if (editingCourseId === courseId) resetCourseForm();
      setNotice('Đã xóa khóa học.');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Không thể xóa khóa học.');
    }
  };

  const handlePublishCourse = async (courseId: number) => {
    try {
      await publishTeacherCourse(courseId);
      setNotice('Đã gửi yêu cầu publish khóa học.');
      setError('');
      await fetchCourses();
    } catch (err: any) {
      setError(err.message || 'Không thể publish khóa học.');
    }
  };

  const handleCreateLesson = async (e: FormEvent) => {
    e.preventDefault();
    if (!lessonForm.courseId) {
      setError('Vui lòng chọn courseId để tạo lesson.');
      return;
    }
    try {
      await createTeacherLesson(lessonForm.courseId, {
        title: lessonForm.title,
        type: lessonForm.type,
        contentUrl: lessonForm.contentUrl || undefined,
        contentText: lessonForm.contentText || undefined,
        durationSeconds: Number(lessonForm.durationSeconds) || undefined,
        orderIndex: Number(lessonForm.orderIndex) || undefined,
      });
      setNotice('Đã tạo lesson cho khóa học.');
      setLessonForm((prev) => ({ ...defaultLessonForm, courseId: prev.courseId }));
      setError('');
    } catch (err: any) {
      setError(err.message || 'Không thể tạo lesson.');
    }
  };

  const handleUploadLessonFile = async () => {
    if (!lessonForm.courseId || !lessonFile) {
      setError('Vui lòng chọn courseId và file để upload.');
      return;
    }
    try {
      const result = await uploadTeacherLessonFile(lessonForm.courseId, lessonFile);
      setNotice(`Upload thành công: ${result.url}`);
      setLessonFile(null);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Không thể upload file lesson.');
    }
  };

  const handleReorderLessons = async () => {
    if (!lessonForm.courseId) {
      setError('Vui lòng chọn courseId để reorder lesson.');
      return;
    }

    let lessonOrders: Array<{ lessonId: number; orderIndex: number }> = [];
    try {
      lessonOrders = JSON.parse(lessonOrderJson) as Array<{ lessonId: number; orderIndex: number }>;
    } catch {
      setError('Lesson order JSON không hợp lệ.');
      return;
    }

    try {
      const result = await reorderTeacherLessons(lessonForm.courseId, lessonOrders);
      setNotice(result.message || 'Đã cập nhật thứ tự lesson.');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật thứ tự lesson.');
    }
  };

  const handleCreateQuestion = async (e: FormEvent) => {
    e.preventDefault();
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
      setError('');
      await fetchQuestions();
    } catch (err: any) {
      setError(err.message || 'Không thể tạo câu hỏi.');
    }
  };

  const handleImportQuestions = async () => {
    if (!questionImportFile) {
      setError('Vui lòng chọn file CSV để import.');
      return;
    }
    try {
      const result = await importTeacherQuestions(questionImportFile);
      setNotice(`${result.message} (${result.count} câu hỏi)`);
      setQuestionImportFile(null);
      setError('');
      await fetchQuestions();
    } catch (err: any) {
      setError(err.message || 'Không thể import câu hỏi.');
    }
  };

  const handleLoadQuestionDetail = async (questionId: number) => {
    try {
      const detail = await getTeacherQuestionDetail(questionId);
      setSelectedQuestionDetail(detail);
      setNotice(`Đã tải chi tiết câu hỏi #${questionId}`);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Không thể tải chi tiết câu hỏi.');
    }
  };

  const handleLoadCourseDetail = async (courseId: number) => {
    try {
      const detail = await getTeacherCourse(courseId);
      setSelectedCourseDetail(detail);
      setNotice(`Đã tải chi tiết khóa học #${courseId}`);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Không thể tải chi tiết khóa học.');
    }
  };

  const handleCreateExam = async (e: FormEvent) => {
    e.preventDefault();
    if (!examForm.courseId) {
      setError('Vui lòng chọn courseId để tạo bài thi.');
      return;
    }
    let partConfig: Record<string, number> | undefined;
    try {
      partConfig = examForm.partConfigJson
        ? (JSON.parse(examForm.partConfigJson) as Record<string, number>)
        : undefined;
    } catch {
      setError('partConfig phải là JSON hợp lệ.');
      return;
    }

    try {
      const payload: ExamRequest = {
        courseId: examForm.courseId,
        title: examForm.title,
        examType: examForm.examType,
        description: examForm.description || undefined,
        timeLimitMinutes: Number(examForm.timeLimitMinutes),
        passingScore: Number(examForm.passingScore),
        isRandomOrder: examForm.isRandomOrder,
        partConfig,
      };
      await createTeacherExam(payload);
      setNotice('Đã tạo bài thi mới.');
      setError('');
      await fetchExams();
    } catch (err: any) {
      setError(err.message || 'Không thể tạo bài thi.');
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Teacher Portal</h1>
          <p>Tích hợp APIs `/teacher/*` theo tài liệu module Teacher.</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/dashboard" className={styles.backLink}>
            ← Student Dashboard
          </Link>
          <button className={styles.refreshBtn} onClick={() => loadTabData(tab)}>
            Làm mới
          </button>
        </div>
      </header>

      <nav className={styles.tabBar}>
        {tabs.map((item) => (
          <button
            key={item.id}
            className={`${styles.tabBtn} ${tab === item.id ? styles.tabActive : ''}`}
            onClick={() => {
              setTab(item.id);
              setError('');
              setNotice('');
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {error && <p className={styles.error}>{error}</p>}
      {notice && <p className={styles.notice}>{notice}</p>}

      {loading && <p className={styles.muted}>Đang tải dữ liệu...</p>}

      {!loading && tab === 'dashboard' && (
        <section className={styles.grid}>
          <article className={styles.card}>
            <h3>Tổng khóa học</h3>
            <strong>{stats?.totalCourses ?? 0}</strong>
          </article>
          <article className={styles.card}>
            <h3>Tổng học viên</h3>
            <strong>{stats?.totalStudents ?? 0}</strong>
          </article>
          <article className={styles.card}>
            <h3>Học viên hoàn thành</h3>
            <strong>{stats?.completedStudents ?? 0}</strong>
          </article>
          <article className={styles.card}>
            <h3>Tỷ lệ hoàn thành</h3>
            <strong>{(stats?.completionRate ?? 0).toFixed(1)}%</strong>
          </article>
        </section>
      )}

      {!loading && tab === 'courses' && (
        <section className={styles.columns}>
          <div className={styles.panel}>
            <h3>{editingCourseId ? `Sửa khóa học #${editingCourseId}` : 'Tạo khóa học mới'}</h3>
            <form onSubmit={handleSubmitCourse} className={styles.form}>
              <input
                placeholder="Tiêu đề khóa học"
                value={courseForm.title}
                onChange={(e) => setCourseForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <textarea
                placeholder="Mô tả"
                value={courseForm.description}
                onChange={(e) => setCourseForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
              <input
                placeholder="Thumbnail URL"
                value={courseForm.thumbnailUrl}
                onChange={(e) => setCourseForm((prev) => ({ ...prev, thumbnailUrl: e.target.value }))}
              />
              <input
                type="number"
                placeholder="Giá"
                value={courseForm.price}
                onChange={(e) => setCourseForm((prev) => ({ ...prev, price: Number(e.target.value) || 0 }))}
              />
              <div className={styles.row}>
                <button type="submit">{editingCourseId ? 'Cập nhật' : 'Tạo khóa học'}</button>
                {editingCourseId && (
                  <button type="button" className={styles.secondaryBtn} onClick={resetCourseForm}>
                    Hủy
                  </button>
                )}
              </div>
            </form>

            <hr className={styles.divider} />

            <h3>Tạo Lesson</h3>
            <form onSubmit={handleCreateLesson} className={styles.form}>
              <select
                value={lessonForm.courseId || ''}
                onChange={(e) =>
                  setLessonForm((prev) => ({ ...prev, courseId: Number(e.target.value) || 0 }))
                }
              >
                <option value="">Chọn course</option>
                {courseOptions.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.id} - {course.title}
                  </option>
                ))}
              </select>
              <input
                placeholder="Tiêu đề lesson"
                value={lessonForm.title}
                onChange={(e) => setLessonForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <select
                value={lessonForm.type}
                onChange={(e) =>
                  setLessonForm((prev) => ({ ...prev, type: e.target.value as LessonRequest['type'] }))
                }
              >
                <option value="VIDEO">VIDEO</option>
                <option value="PDF">PDF</option>
                <option value="QUIZ">QUIZ</option>
              </select>
              <input
                placeholder="contentUrl"
                value={lessonForm.contentUrl}
                onChange={(e) => setLessonForm((prev) => ({ ...prev, contentUrl: e.target.value }))}
              />
              <textarea
                placeholder="contentText (tuỳ chọn)"
                value={lessonForm.contentText}
                onChange={(e) => setLessonForm((prev) => ({ ...prev, contentText: e.target.value }))}
                rows={3}
              />
              <div className={styles.row}>
                <input
                  type="number"
                  placeholder="durationSeconds"
                  value={lessonForm.durationSeconds}
                  onChange={(e) =>
                    setLessonForm((prev) => ({ ...prev, durationSeconds: Number(e.target.value) || 0 }))
                  }
                />
                <input
                  type="number"
                  placeholder="orderIndex"
                  value={lessonForm.orderIndex}
                  onChange={(e) =>
                    setLessonForm((prev) => ({ ...prev, orderIndex: Number(e.target.value) || 1 }))
                  }
                />
              </div>
              <button type="submit">Tạo lesson</button>
            </form>

            <div className={styles.uploadArea}>
              <input type="file" onChange={(e) => setLessonFile(e.target.files?.[0] || null)} />
              <button onClick={handleUploadLessonFile}>Upload file lesson</button>
            </div>

            <div className={styles.uploadArea} style={{ marginTop: '8px', display: 'block' }}>
              <textarea
                rows={3}
                value={lessonOrderJson}
                onChange={(e) => setLessonOrderJson(e.target.value)}
                placeholder='Lesson order JSON, ví dụ [{"lessonId":1,"orderIndex":1}]'
              />
              <button onClick={handleReorderLessons}>Cập nhật thứ tự lessons</button>
            </div>

            {selectedCourseDetail && (
              <div className={styles.listItem} style={{ marginTop: '10px' }}>
                <strong>Chi tiết khóa học #{selectedCourseDetail.id}</strong>
                <p>{selectedCourseDetail.description || 'Không có mô tả'}</p>
                <small>
                  Price: {selectedCourseDetail.price?.toLocaleString('vi-VN')}đ • Status:{' '}
                  {selectedCourseDetail.status || 'N/A'}
                </small>
              </div>
            )}
          </div>

          <div className={styles.panel}>
            <h3>Danh sách khóa học</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td>{course.id}</td>
                    <td>{course.title}</td>
                    <td>{course.status || (course.isPublished ? 'PUBLISHED' : 'DRAFT')}</td>
                    <td>
                      <div className={styles.row}>
                        <button className={styles.secondaryBtn} onClick={() => handleEditCourse(course)}>
                          Sửa
                        </button>
                        <button className={styles.secondaryBtn} onClick={() => handleLoadCourseDetail(course.id)}>
                          Chi tiết
                        </button>
                        <button className={styles.secondaryBtn} onClick={() => handlePublishCourse(course.id)}>
                          Publish
                        </button>
                        <button className={styles.secondaryBtn} onClick={() => handleDeleteCourse(course.id)}>
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!loading && tab === 'questions' && (
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
              <button type="submit">Tạo câu hỏi</button>
            </form>

            <hr className={styles.divider} />

            <h3>Import câu hỏi từ CSV</h3>
            <div className={styles.uploadArea}>
              <input type="file" accept=".csv" onChange={(e) => setQuestionImportFile(e.target.files?.[0] || null)} />
              <button onClick={handleImportQuestions}>Import</button>
            </div>
          </div>

          <div className={styles.panel}>
            <h3>Question bank</h3>
            <div className={styles.list}>
              {questions.map((question) => (
                <article key={question.id} className={styles.listItem}>
                  <strong>#{question.id} {question.part}</strong>
                  <p>{question.content}</p>
                  <small>
                    {question.examType} • {question.section} • {question.difficulty}
                  </small>
                  <div style={{ marginTop: '8px' }}>
                    <button className={styles.secondaryBtn} onClick={() => handleLoadQuestionDetail(question.id)}>
                      Xem chi tiết
                    </button>
                  </div>
                </article>
              ))}
              {questions.length === 0 && <p className={styles.muted}>Chưa có câu hỏi.</p>}
            </div>

            {selectedQuestionDetail && (
              <article className={styles.listItem} style={{ marginTop: '10px' }}>
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
      )}

      {!loading && tab === 'exams' && (
        <section className={styles.columns}>
          <div className={styles.panel}>
            <h3>Tạo bài thi</h3>
            <form onSubmit={handleCreateExam} className={styles.form}>
              <select
                value={examForm.courseId || ''}
                onChange={(e) => setExamForm((prev) => ({ ...prev, courseId: Number(e.target.value) || 0 }))}
              >
                <option value="">Chọn course</option>
                {courseOptions.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.id} - {course.title}
                  </option>
                ))}
              </select>
              <input
                placeholder="Tiêu đề bài thi"
                value={examForm.title}
                onChange={(e) => setExamForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <input
                placeholder="Exam type"
                value={examForm.examType}
                onChange={(e) => setExamForm((prev) => ({ ...prev, examType: e.target.value }))}
              />
              <textarea
                placeholder="Mô tả"
                value={examForm.description}
                onChange={(e) => setExamForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
              <div className={styles.row}>
                <input
                  type="number"
                  placeholder="timeLimitMinutes"
                  value={examForm.timeLimitMinutes}
                  onChange={(e) =>
                    setExamForm((prev) => ({ ...prev, timeLimitMinutes: Number(e.target.value) || 0 }))
                  }
                />
                <input
                  type="number"
                  placeholder="passingScore"
                  value={examForm.passingScore}
                  onChange={(e) =>
                    setExamForm((prev) => ({ ...prev, passingScore: Number(e.target.value) || 0 }))
                  }
                />
              </div>
              <textarea
                placeholder='partConfig JSON, ví dụ {"PART_1":6,"PART_2":25}'
                value={examForm.partConfigJson}
                onChange={(e) => setExamForm((prev) => ({ ...prev, partConfigJson: e.target.value }))}
                rows={3}
              />
              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={examForm.isRandomOrder}
                  onChange={(e) => setExamForm((prev) => ({ ...prev, isRandomOrder: e.target.checked }))}
                />
                Trộn ngẫu nhiên câu hỏi
              </label>
              <button type="submit">Tạo bài thi</button>
            </form>
          </div>

          <div className={styles.panel}>
            <h3>Danh sách bài thi</h3>
            <div className={styles.list}>
              {exams.map((exam) => (
                <article key={exam.id} className={styles.listItem}>
                  <strong>#{exam.id} {exam.title}</strong>
                  <p>{exam.description || 'Không có mô tả.'}</p>
                  <small>
                    courseId: {exam.courseId} • {exam.examType || 'N/A'} • {exam.timeLimitMinutes || 0} phút
                  </small>
                </article>
              ))}
              {exams.length === 0 && <p className={styles.muted}>Chưa có bài thi.</p>}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
