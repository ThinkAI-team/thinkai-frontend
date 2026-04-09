'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import PageState from '@/components/ui/PageState';
import { formatVnd } from '@/lib/utils/format';
import { ApiException } from '@/services/api';
import { logout } from '@/services/auth';
import { sendChatMessage } from '@/services/ai-tutor';
import { getProfile, type ProfileResponse } from '@/services/user';
import {
  createTeacherCourse,
  createTeacherLesson,
  deleteTeacherCourse,
  getTeacherCourse,
  getTeacherCourses,
  publishTeacherCourse,
  reorderTeacherLessons,
  updateTeacherCourse,
  uploadTeacherCourseThumbnail,
  uploadTeacherLessonFile,
  type LessonRequest,
  type TeacherCourse,
} from '@/services/teacher';
import dashboardStyles from '../../(main)/dashboard/page.module.css';
import styles from '../page.module.css';
import TeacherShell from '../components/TeacherShell';

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

interface CourseTutorSuggestion {
  course?: {
    title?: string;
    description?: string;
    price?: number;
    thumbnailUrl?: string;
  };
  lesson?: {
    title?: string;
    type?: LessonRequest['type'];
    contentText?: string;
    durationSeconds?: number;
    orderIndex?: number;
  };
}

export default function TeacherCoursesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [courseForm, setCourseForm] = useState(defaultCourseForm);
  const [thumbnailSourceType, setThumbnailSourceType] = useState<'url' | 'file'>('url');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [lessonForm, setLessonForm] = useState(defaultLessonForm);
  const [lessonFile, setLessonFile] = useState<File | null>(null);
  const [contentSourceType, setContentSourceType] = useState<'url' | 'file'>('url');
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [lessonOrderJson, setLessonOrderJson] = useState('[{"lessonId":1,"orderIndex":1}]');
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<TeacherCourse | null>(null);
  const [tutorSummary, setTutorSummary] = useState('');
  const [tutorSummaryLoading, setTutorSummaryLoading] = useState(false);
  const [tutorSummaryError, setTutorSummaryError] = useState('');
  const [tutorSuggestion, setTutorSuggestion] = useState<CourseTutorSuggestion | null>(null);
  const showBlockingLoading = loading && courses.length === 0;

  const tryParseTutorSuggestion = (raw: string): CourseTutorSuggestion | null => {
    const jsonBlockMatch = raw.match(/```json\s*([\s\S]*?)```/i);
    const candidate = jsonBlockMatch?.[1] || raw;
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start < 0 || end < 0 || end <= start) return null;
    try {
      const parsed = JSON.parse(candidate.slice(start, end + 1));
      return parsed && typeof parsed === 'object' ? (parsed as CourseTutorSuggestion) : null;
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

      const coursesPage = await getTeacherCourses(0, 20);
      setCourses(coursesPage.content || []);
    } catch (err: any) {
      if (err instanceof ApiException && err.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setTimeout(() => router.push('/login'), 1200);
      } else {
        setError(err.message || 'Không thể tải dữ liệu khóa học.');
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

  const resetCourseForm = () => {
    setCourseForm(defaultCourseForm);
    setThumbnailSourceType('url');
    setThumbnailFile(null);
    setEditingCourseId(null);
  };

  const courseOptions = useMemo(
    () =>
      courses.map((course) => ({
        id: course.id,
        title: course.title,
      })),
    [courses]
  );

  const handleSubmitCourse = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      if (editingCourseId) {
        if (thumbnailSourceType === 'file' && thumbnailFile) {
          const uploadResult = await uploadTeacherCourseThumbnail(editingCourseId, thumbnailFile);
          await updateTeacherCourse(editingCourseId, {
            title: courseForm.title,
            description: courseForm.description,
            thumbnailUrl: uploadResult.url,
            price: Number(courseForm.price),
          });
          setNotice('Đã cập nhật khóa học và upload thumbnail.');
        } else {
          await updateTeacherCourse(editingCourseId, {
            title: courseForm.title,
            description: courseForm.description,
            thumbnailUrl: courseForm.thumbnailUrl || undefined,
            price: Number(courseForm.price),
          });
          setNotice('Đã cập nhật khóa học.');
        }
      } else {
        if (thumbnailSourceType === 'file' && thumbnailFile) {
          const tempCourse = await createTeacherCourse({
            title: courseForm.title,
            description: courseForm.description,
            price: Number(courseForm.price),
          });
          const uploadResult = await uploadTeacherCourseThumbnail(tempCourse.id, thumbnailFile);
          await updateTeacherCourse(tempCourse.id, {
            title: courseForm.title,
            description: courseForm.description,
            thumbnailUrl: uploadResult.url,
            price: Number(courseForm.price),
          });
          setNotice('Đã tạo khóa học và upload thumbnail.');
        } else {
          await createTeacherCourse({
            title: courseForm.title,
            description: courseForm.description,
            thumbnailUrl: courseForm.thumbnailUrl || undefined,
            price: Number(courseForm.price),
          });
          setNotice('Đã tạo khóa học mới.');
        }
      }
      
      resetCourseForm();
      await loadData();
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
    setThumbnailSourceType('url');
    setThumbnailFile(null);
  };

  const handleDeleteCourse = async (courseId: number) => {
    setError('');
    setNotice('');
    try {
      await deleteTeacherCourse(courseId);
      setCourses((prev) => prev.filter((item) => item.id !== courseId));
      if (editingCourseId === courseId) {
        resetCourseForm();
      }
      if (selectedCourseDetail?.id === courseId) {
        setSelectedCourseDetail(null);
      }
      setNotice('Đã xóa khóa học.');
    } catch (err: any) {
      setError(err.message || 'Không thể xóa khóa học.');
    }
  };

  const handlePublishCourse = async (courseId: number) => {
    setError('');
    setNotice('');
    try {
      await publishTeacherCourse(courseId);
      setNotice('Đã gửi yêu cầu publish khóa học.');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Không thể publish khóa học.');
    }
  };

  const handleLoadCourseDetail = async (courseId: number) => {
    setError('');
    setNotice('');
    try {
      const detail = await getTeacherCourse(courseId);
      setSelectedCourseDetail(detail);
      setNotice(`Đã tải chi tiết khóa học #${courseId}`);
    } catch (err: any) {
      setError(err.message || 'Không thể tải chi tiết khóa học.');
    }
  };

  const handleCreateLesson = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!lessonForm.courseId) {
      setError('Vui lòng chọn courseId để tạo lesson.');
      return;
    }
    try {
      let finalContentUrl = lessonForm.contentUrl;
      if (contentSourceType === 'file' && contentFile) {
        const uploadResult = await uploadTeacherLessonFile(lessonForm.courseId, contentFile);
        finalContentUrl = uploadResult.url;
        setContentFile(null);
      }
      await createTeacherLesson(lessonForm.courseId, {
        title: lessonForm.title,
        type: lessonForm.type,
        contentUrl: finalContentUrl || undefined,
        contentText: lessonForm.contentText || undefined,
        durationSeconds: Number(lessonForm.durationSeconds) || undefined,
        orderIndex: Number(lessonForm.orderIndex) || undefined,
      });
      setNotice('Đã tạo lesson cho khóa học.');
      setLessonForm((prev) => ({ ...defaultLessonForm, courseId: prev.courseId }));
      setContentFile(null);
    } catch (err: any) {
      setError(err.message || 'Không thể tạo lesson.');
    }
  };

  const handleUploadLessonFile = async () => {
    setError('');
    setNotice('');
    if (!lessonForm.courseId || !lessonFile) {
      setError('Vui lòng chọn courseId và file để upload.');
      return;
    }
    try {
      const result = await uploadTeacherLessonFile(lessonForm.courseId, lessonFile);
      setNotice(`Upload thành công: ${result.url}`);
      setLessonFile(null);
    } catch (err: any) {
      setError(err.message || 'Không thể upload file lesson.');
    }
  };

  const handleReorderLessons = async () => {
    setError('');
    setNotice('');
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
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật thứ tự lesson.');
    }
  };

  const handleGenerateTutorSummary = async () => {
    setTutorSummaryLoading(true);
    setTutorSummaryError('');
    setTutorSuggestion(null);
    try {
      const contextPayload = {
        page: 'teacher-courses',
        courseForm,
        editingCourseId,
        lessonForm,
        lessonOrderJson,
        selectedCourseDetail: selectedCourseDetail
          ? {
              id: selectedCourseDetail.id,
              title: selectedCourseDetail.title,
              status: selectedCourseDetail.status,
            }
          : null,
        courseListSample: courses.slice(0, 12).map((course) => ({
          id: course.id,
          title: course.title,
          status: course.status,
          published: course.isPublished,
          price: course.price,
        })),
      };

      const response = await sendChatMessage({
        message:
          'Hãy tóm tắt ngắn tình trạng trang quản lý khóa học giáo viên và đề xuất 8 câu hỏi kiểm tra chất lượng nội dung khóa học/lesson. Trả lời bằng tiếng Việt, có 3 phần: (1) Tóm tắt, (2) Rủi ro/chỗ thiếu dữ liệu, (3) Danh sách câu hỏi gợi ý. Cuối cùng thêm một khối ```json``` theo schema {"course":{"title":"","description":"","price":0,"thumbnailUrl":""},"lesson":{"title":"","type":"VIDEO","contentText":"","durationSeconds":0,"orderIndex":1}} để frontend tự điền.',
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
    if (tutorSuggestion.course) {
      setCourseForm((prev) => ({
        ...prev,
        title: tutorSuggestion.course?.title || prev.title,
        description: tutorSuggestion.course?.description || prev.description,
        price: Number.isFinite(Number(tutorSuggestion.course?.price))
          ? Number(tutorSuggestion.course?.price)
          : prev.price,
        thumbnailUrl: tutorSuggestion.course?.thumbnailUrl || prev.thumbnailUrl,
      }));
    }
    if (tutorSuggestion.lesson) {
      setLessonForm((prev) => ({
        ...prev,
        title: tutorSuggestion.lesson?.title || prev.title,
        type: tutorSuggestion.lesson?.type || prev.type,
        contentText: tutorSuggestion.lesson?.contentText || prev.contentText,
        durationSeconds: Number.isFinite(Number(tutorSuggestion.lesson?.durationSeconds))
          ? Number(tutorSuggestion.lesson?.durationSeconds)
          : prev.durationSeconds,
        orderIndex: Number.isFinite(Number(tutorSuggestion.lesson?.orderIndex))
          ? Number(tutorSuggestion.lesson?.orderIndex)
          : prev.orderIndex,
      }));
    }
    setNotice('Đã áp dụng gợi ý từ Tutor vào form.');
  };

  return (
    <TeacherShell
      profile={profile}
      activeNav="courses"
      title="Quản lý khóa học"
      subtitle="Tạo, chỉnh sửa, publish khóa học và quản lý lesson bằng teacher endpoints."
      onRefreshAction={loadData}
      onLogoutAction={handleLogout}
      notice={notice}
      error={error}
      rightSidebar={(
        <>
          <div className={dashboardStyles.lessonList}>
            <h3>Tình trạng khóa học</h3>
            <p className={dashboardStyles.lessonCourse}>Tổng: {courses.length} khóa học</p>
            <div className={dashboardStyles.chapters}>
              {courses.slice(0, 6).map((course) => (
                <div key={course.id} className={dashboardStyles.chapter}>
                  <span className={dashboardStyles.chapterCheck}>
                    {course.isPublished || course.status === 'APPROVED' ? '✓' : '○'}
                  </span>
                  <div>
                    <p className={dashboardStyles.chapterTitle}>{course.title}</p>
                    <p className={dashboardStyles.chapterMeta}>
                      {(course.status || (course.isPublished ? 'APPROVED' : 'DRAFT')).toUpperCase()}
                    </p>
                  </div>
                </div>
              ))}
              {courses.length === 0 && (
                <div className={dashboardStyles.chapter}>
                  <span className={dashboardStyles.chapterLock}>○</span>
                  <div>
                    <p className={dashboardStyles.chapterTitle}>Chưa có khóa học</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    >
      {showBlockingLoading ? (
        <PageState
          type="loading"
          title="Đang tải khóa học giảng viên"
          message="Hệ thống đang đồng bộ danh sách khóa học và lesson."
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
                Bấm "Tạo summary" để Tutor phân tích toàn bộ dữ liệu đang có trên trang và đề xuất bộ câu hỏi.
              </p>
            )}
          </div>
          <section className={styles.columns}>
            <div className={styles.panel}>
            <h3>{editingCourseId ? `Sửa khóa học #${editingCourseId}` : 'Tạo khóa học mới'}</h3>
            <form onSubmit={handleSubmitCourse} className={styles.form}>
              <input
                placeholder="Tiêu đề khóa học"
                value={courseForm.title}
                onChange={(e) => setCourseForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
              <textarea
                placeholder="Mô tả"
                value={courseForm.description}
                onChange={(e) => setCourseForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                required
              />
              <div className={styles.sourceToggle}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="thumbnailSource"
                    checked={thumbnailSourceType === 'url'}
                    onChange={() => setThumbnailSourceType('url')}
                  />
                  Nhập URL
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="thumbnailSource"
                    checked={thumbnailSourceType === 'file'}
                    onChange={() => setThumbnailSourceType('file')}
                  />
                  Upload từ máy
                </label>
              </div>
              {thumbnailSourceType === 'url' ? (
                <input
                  placeholder="Thumbnail URL"
                  value={courseForm.thumbnailUrl}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, thumbnailUrl: e.target.value }))}
                />
              ) : (
                <>
                  <label className={styles.fileInputLabel}>
                    <input
                      type="file"
                      id="thumbnailFile"
                      accept="image/*"
                      className={styles.hiddenInput}
                      onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                    />
                    <span className={styles.fileInputText}>
                      {thumbnailFile ? thumbnailFile.name : 'Chọn ảnh thumbnail...'}
                    </span>
                  </label>
                  {thumbnailFile && (
                    <div className={styles.imagePreview}>
                      <img src={URL.createObjectURL(thumbnailFile)} alt="Thumbnail preview" />
                    </div>
                  )}
                </>
              )}
              <input
                type="number"
                placeholder="Giá"
                value={courseForm.price}
                onChange={(e) => setCourseForm((prev) => ({ ...prev, price: Number(e.target.value) || 0 }))}
                min={0}
              />
              <div className={styles.row}>
                <Button variant="primary" size="sm" type="submit" className={styles.primaryBtn}>
                  {editingCourseId ? 'Cập nhật' : 'Tạo khóa học'}
                </Button>
                {editingCourseId && (
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={resetCourseForm}
                  >
                    Hủy
                  </Button>
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
                required
              />
              <select
                value={lessonForm.type}
                onChange={(e) =>
                  setLessonForm((prev) => ({ ...prev, type: e.target.value as LessonRequest['type'], contentUrl: '' }))
                }
              >
                <option value="VIDEO">VIDEO</option>
                <option value="PDF">PDF</option>
                <option value="QUIZ">QUIZ</option>
              </select>
              {(lessonForm.type === 'VIDEO' || lessonForm.type === 'PDF') && (
                <>
                  <div className={styles.sourceToggle}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="contentSource"
                        checked={contentSourceType === 'url'}
                        onChange={() => setContentSourceType('url')}
                      />
                      Nhập URL
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="contentSource"
                        checked={contentSourceType === 'file'}
                        onChange={() => setContentSourceType('file')}
                      />
                      Upload từ máy
                    </label>
                  </div>
                  {contentSourceType === 'url' ? (
                    <input
                      placeholder="contentUrl"
                      value={lessonForm.contentUrl}
                      onChange={(e) => setLessonForm((prev) => ({ ...prev, contentUrl: e.target.value }))}
                    />
                  ) : (
                    <label className={styles.fileInputLabel}>
                      <input
                        type="file"
                        id="lessonContentFile"
                        accept={lessonForm.type === 'VIDEO' ? 'video/*' : 'application/pdf'}
                        className={styles.hiddenInput}
                        onChange={(e) => setContentFile(e.target.files?.[0] || null)}
                      />
                      <span className={styles.fileInputText}>
                        {contentFile ? contentFile.name : `Chọn file ${lessonForm.type === 'VIDEO' ? 'video' : 'PDF'}...`}
                      </span>
                    </label>
                  )}
                  {contentSourceType === 'file' && contentFile && (
                    <span className={styles.fileName}>{contentFile.name}</span>
                  )}
                </>
              )}
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
                  min={0}
                />
                <input
                  type="number"
                  placeholder="orderIndex"
                  value={lessonForm.orderIndex}
                  onChange={(e) =>
                    setLessonForm((prev) => ({ ...prev, orderIndex: Number(e.target.value) || 1 }))
                  }
                  min={1}
                />
              </div>
              <Button variant="primary" size="sm" type="submit" className={styles.primaryBtn}>
                Tạo lesson
              </Button>
            </form>

            <div className={styles.uploadArea}>
              <input type="file" onChange={(e) => setLessonFile(e.target.files?.[0] || null)} />
              <Button
                variant="primary"
                size="sm"
                type="button"
                className={styles.primaryBtn}
                onClick={handleUploadLessonFile}
              >
                Upload file lesson
              </Button>
            </div>

            <div className={styles.uploadAreaBlock}>
              <textarea
                rows={3}
                value={lessonOrderJson}
                onChange={(e) => setLessonOrderJson(e.target.value)}
                placeholder='Lesson order JSON, ví dụ [{"lessonId":1,"orderIndex":1}]'
              />
              <Button
                variant="primary"
                size="sm"
                type="button"
                className={styles.primaryBtn}
                onClick={handleReorderLessons}
              >
                Cập nhật thứ tự lessons
              </Button>
            </div>

            {selectedCourseDetail && (
              <div className={`${styles.listItem} ${styles.detailCard}`}>
                <strong>Chi tiết khóa học #{selectedCourseDetail.id}</strong>
                <p>{selectedCourseDetail.description || 'Không có mô tả'}</p>
                <small>
                  Price: {formatVnd(selectedCourseDetail.price)} • Status:{' '}
                  {selectedCourseDetail.status || 'N/A'}
                </small>
              </div>
            )}
          </div>

          <div className={styles.panel}>
            <h3>Danh sách khóa học</h3>
            {courses.length === 0 ? (
              <PageState
                type="empty"
                message="Bạn chưa tạo khóa học nào. Hãy tạo khóa học đầu tiên ở khung bên trái."
                actionLabel="Tải lại"
                onAction={loadData}
              />
            ) : (
              <div className={styles.tableWrap}>
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
                            <Button
                              variant="secondary"
                              size="sm"
                              type="button"
                              className={styles.secondaryBtn}
                              onClick={() => handleEditCourse(course)}
                            >
                              Sửa
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              type="button"
                              className={styles.secondaryBtn}
                              onClick={() => handleLoadCourseDetail(course.id)}
                            >
                              Chi tiết
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              type="button"
                              className={styles.secondaryBtn}
                              onClick={() => handlePublishCourse(course.id)}
                            >
                              Publish
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              type="button"
                              className={styles.secondaryBtn}
                              onClick={() => handleDeleteCourse(course.id)}
                            >
                              Xóa
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </section>
        </>
      )}
    </TeacherShell>
  );
}
