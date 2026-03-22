'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import PageState from '@/components/ui/PageState';
import { formatVnd } from '@/lib/utils/format';
import { ApiException } from '@/services/api';
import { logout } from '@/services/auth';
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

export default function TeacherCoursesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [courseForm, setCourseForm] = useState(defaultCourseForm);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [lessonForm, setLessonForm] = useState(defaultLessonForm);
  const [lessonFile, setLessonFile] = useState<File | null>(null);
  const [lessonOrderJson, setLessonOrderJson] = useState('[{"lessonId":1,"orderIndex":1}]');
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<TeacherCourse | null>(null);
  const showBlockingLoading = loading && courses.length === 0;

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
      )}
    </TeacherShell>
  );
}
