'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import PageState from '@/components/ui/PageState';
import { ApiException } from '@/services/api';
import { logout } from '@/services/auth';
import { getProfile, type ProfileResponse } from '@/services/user';
import {
  createTeacherExam,
  getTeacherCourses,
  getTeacherExams,
  type ExamRequest,
  type TeacherCourse,
  type TeacherExam,
} from '@/services/teacher';
import dashboardStyles from '../../(main)/dashboard/page.module.css';
import styles from '../page.module.css';
import TeacherShell from '../components/TeacherShell';

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

export default function TeacherExamsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [exams, setExams] = useState<TeacherExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [examForm, setExamForm] = useState(defaultExamForm);
  const showBlockingLoading = loading && courses.length === 0 && exams.length === 0;

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

      const [coursePage, examPage] = await Promise.all([
        getTeacherCourses(0, 20),
        getTeacherExams(0, 20),
      ]);

      setCourses(coursePage.content || []);
      setExams(examPage.content || []);
    } catch (err: any) {
      if (err instanceof ApiException && err.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setTimeout(() => router.push('/login'), 1200);
      } else {
        setError(err.message || 'Không thể tải dữ liệu bài thi.');
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

  const courseOptions = useMemo(
    () =>
      courses.map((course) => ({
        id: course.id,
        title: course.title,
      })),
    [courses]
  );

  const handleCreateExam = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
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
      setExamForm((prev) => ({ ...defaultExamForm, courseId: prev.courseId }));
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Không thể tạo bài thi.');
    }
  };

  return (
    <TeacherShell
      profile={profile}
      activeNav="exams"
      title="Quản lý bài thi"
      subtitle="Tạo bài thi mới và theo dõi danh sách bài thi bằng teacher endpoints."
      onRefreshAction={loadData}
      onLogoutAction={handleLogout}
      notice={notice}
      error={error}
      rightSidebar={(
        <div className={dashboardStyles.lessonList}>
          <h3>Tổng quan bài thi</h3>
          <p className={dashboardStyles.lessonCourse}>Tổng: {exams.length} bài thi</p>
          <div className={styles.kpiList}>
            <div className={styles.kpiRow}>
              <span>Khóa học có bài thi</span>
              <strong>{new Set(exams.map((exam) => exam.courseId)).size}</strong>
            </div>
            <div className={styles.kpiRow}>
              <span>Random order bật</span>
              <strong>{exams.filter((exam) => exam.isRandomOrder).length}</strong>
            </div>
          </div>
        </div>
      )}
    >
      {showBlockingLoading ? (
        <PageState
          type="loading"
          title="Đang tải bài thi giảng viên"
          message="Hệ thống đang đồng bộ danh sách khóa học và đề thi."
        />
      ) : (
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
                required
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
                  min={1}
                />
                <input
                  type="number"
                  placeholder="passingScore"
                  value={examForm.passingScore}
                  onChange={(e) =>
                    setExamForm((prev) => ({ ...prev, passingScore: Number(e.target.value) || 0 }))
                  }
                  min={0}
                  max={100}
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
              <Button variant="primary" size="sm" type="submit" className={styles.primaryBtn}>
                Tạo bài thi
              </Button>
            </form>
          </div>

          <div className={styles.panel}>
            <h3>Danh sách bài thi</h3>
            {exams.length === 0 ? (
              <PageState
                type="empty"
                message="Chưa có bài thi nào. Bạn có thể tạo bài thi mới ở khung bên trái."
                actionLabel="Tải lại"
                onAction={loadData}
              />
            ) : (
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
              </div>
            )}
          </div>
        </section>
      )}
    </TeacherShell>
  );
}
