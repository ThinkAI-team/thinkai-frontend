'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import PageState from '@/components/ui/PageState';
import { formatVnd } from '@/lib/utils/format';
import { ApiException } from '@/services/api';
import { logout } from '@/services/auth';
import { getProfile, type ProfileResponse } from '@/services/user';
import {
  getTeacherCourses,
  getTeacherDashboard,
  getTeacherExams,
  publishTeacherCourse,
  type TeacherCourse,
  type TeacherDashboardStats,
  type TeacherExam,
} from '@/services/teacher';
import dashboardStyles from '../(main)/dashboard/page.module.css';
import styles from './page.module.css';
import TeacherShell from './components/TeacherShell';

export default function TeacherOverviewPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [stats, setStats] = useState<TeacherDashboardStats | null>(null);
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [exams, setExams] = useState<TeacherExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [publishingCourseId, setPublishingCourseId] = useState<number | null>(null);

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

      const [statsData, coursePage, examPage] = await Promise.all([
        getTeacherDashboard(),
        getTeacherCourses(0, 20),
        getTeacherExams(0, 20),
      ]);

      setStats(statsData);
      setCourses(coursePage.content || []);
      setExams(examPage.content || []);
    } catch (err: any) {
      if (err instanceof ApiException && err.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setTimeout(() => router.push('/login'), 1200);
      } else {
        setError(err.message || 'Không thể tải dữ liệu giảng viên.');
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

  const publishedCourses = useMemo(
    () => courses.filter((course) => Boolean(course.isPublished) || course.status === 'APPROVED').length,
    [courses]
  );

  const draftCourses = Math.max(courses.length - publishedCourses, 0);
  const firstCourse = courses[0];
  const latestExam = exams[0];
  const showBlockingLoading = loading && !stats && courses.length === 0 && exams.length === 0;

  const averagePrice = useMemo(() => {
    if (!courses.length) return 0;
    const total = courses.reduce((sum, course) => sum + Number(course.price || 0), 0);
    return Math.round(total / courses.length);
  }, [courses]);

  const publicationRate = courses.length ? Math.round((publishedCourses / courses.length) * 100) : 0;

  const handleQuickPublish = async (course: TeacherCourse) => {
    if (course.isPublished || course.status === 'APPROVED') return;
    setPublishingCourseId(course.id);
    setError('');
    setNotice('');
    try {
      await publishTeacherCourse(course.id);
      setNotice(`Đã publish khóa học "${course.title}".`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Không thể publish khóa học.');
    } finally {
      setPublishingCourseId(null);
    }
  };

  return (
    <TeacherShell
      profile={profile}
      activeNav="overview"
      title="Tổng quan giảng dạy"
      subtitle="Theo dõi hiệu suất lớp học và tình trạng nội dung từ teacher endpoints."
      onRefreshAction={loadData}
      onLogoutAction={handleLogout}
      notice={notice}
      error={error}
      rightSidebar={(
        <>
          <div className={dashboardStyles.lessonList}>
            <h3>Khóa học giảng dạy</h3>
            <p className={dashboardStyles.lessonCourse}>Theo dõi nhanh trạng thái xuất bản</p>

            <div className={dashboardStyles.chapters}>
              {courses.slice(0, 5).map((course) => (
                <div key={course.id} className={dashboardStyles.chapter}>
                  <span className={dashboardStyles.chapterCheck}>
                    {course.isPublished || course.status === 'APPROVED' ? '✓' : '○'}
                  </span>
                  <div>
                    <p className={dashboardStyles.chapterNumber}>COURSE #{course.id}</p>
                    <p className={dashboardStyles.chapterTitle}>{course.title}</p>
                    <p className={dashboardStyles.chapterMeta}>
                      {(course.status || (course.isPublished ? 'APPROVED' : 'DRAFT')).toUpperCase()} •{' '}
                      {formatVnd(course.price || 0)}
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

          <div className={dashboardStyles.calendar}>
            <div className={dashboardStyles.calendarHeader}>
              <h4>Tổng quan nhanh</h4>
              <span className={styles.calendarHint}>Teacher</span>
            </div>
            <div className={styles.kpiList}>
              <div className={styles.kpiRow}>
                <span>Học viên hoàn thành</span>
                <strong>{stats?.completedStudents || 0}</strong>
              </div>
              <div className={styles.kpiRow}>
                <span>Giá trung bình / khoá</span>
                <strong>{formatVnd(averagePrice)}</strong>
              </div>
              <div className={styles.kpiRow}>
                <span>Tổng đề thi</span>
                <strong>{exams.length}</strong>
              </div>
            </div>
          </div>
        </>
      )}
    >
      {showBlockingLoading ? (
        <PageState
          type="loading"
          title="Đang tải dashboard giảng viên"
          message="Hệ thống đang đồng bộ khóa học, học viên và bài thi của bạn."
        />
      ) : (
        <>
          <div className={dashboardStyles.statsGrid}>
            <div className={dashboardStyles.statCard}>
              <div className={dashboardStyles.statIcon}>Khóa</div>
              <div>
                <div className={dashboardStyles.statValue}>{stats?.totalCourses || 0}</div>
                <div className={dashboardStyles.statLabel}>KHOÁ HỌC ĐANG QUẢN LÝ</div>
              </div>
            </div>
            <div className={dashboardStyles.statCard}>
              <div className={dashboardStyles.statIcon}>Lớp</div>
              <div>
                <div className={dashboardStyles.statValue}>{stats?.totalStudents || 0}</div>
                <div className={dashboardStyles.statLabel}>TỔNG HỌC VIÊN</div>
              </div>
            </div>
            <div className={dashboardStyles.statCard}>
              <div className={dashboardStyles.statIcon}>Tỷ lệ</div>
              <div>
                <div className={dashboardStyles.statValue}>{Math.round(stats?.completionRate || 0)}%</div>
                <div className={dashboardStyles.statLabel}>TỶ LỆ HOÀN THÀNH</div>
              </div>
            </div>
          </div>

          <section className={dashboardStyles.section}>
            <div className={dashboardStyles.sectionHeader}>
              <h2>Tiếp tục quản lý</h2>
            </div>

            {firstCourse ? (
              <div className={dashboardStyles.courseCard}>
                <div className={dashboardStyles.courseImage}>
                  <span>TEACH</span>
                </div>
                <div className={dashboardStyles.courseInfo}>
                  <div className={dashboardStyles.courseMeta}>
                    <span className={dashboardStyles.courseTag}>KHÓA HỌC NỔI BẬT</span>
                    <span
                      className={`${styles.statusBadge} ${
                        firstCourse.isPublished || firstCourse.status === 'APPROVED'
                          ? styles.statusPublished
                          : styles.statusDraft
                      }`}
                    >
                      {firstCourse.isPublished || firstCourse.status === 'APPROVED' ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </div>
                  <h3>{firstCourse.title}</h3>
                  <p>{firstCourse.description || 'Khóa học chưa có mô tả chi tiết.'}</p>
                  <div className={dashboardStyles.progressSection}>
                    <div className={dashboardStyles.progressBar}>
                      <div className={dashboardStyles.progressFill} style={{ width: `${publicationRate}%` }} />
                    </div>
                    <span className={dashboardStyles.progressText}>{publicationRate}% published</span>
                  </div>
                </div>
                <div className={styles.actionGroup}>
                  <Button variant="secondary" onClick={loadData}>Đồng bộ</Button>
                  {!firstCourse.isPublished && firstCourse.status !== 'APPROVED' && (
                    <Button
                      variant="primary"
                      onClick={() => handleQuickPublish(firstCourse)}
                      disabled={publishingCourseId === firstCourse.id}
                    >
                      {publishingCourseId === firstCourse.id ? 'Đang publish...' : 'Publish nhanh'}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className={dashboardStyles.courseCard}>
                <div className={dashboardStyles.courseInfo}>
                  <h3>Bạn chưa có khóa học nào</h3>
                  <p>Hãy tạo khóa học mới từ teacher APIs để bắt đầu giảng dạy.</p>
                </div>
                <Button variant="primary" onClick={loadData}>Làm mới dữ liệu</Button>
              </div>
            )}
          </section>

          <div className={dashboardStyles.bottomGrid}>
            <div className={dashboardStyles.suggestionCard}>
              <h3>Gợi ý vận hành</h3>
              <div className={dashboardStyles.suggestion}>
                <span className={dashboardStyles.suggestionIcon}>Gợi ý</span>
                <div>
                  <p className={dashboardStyles.suggestionTitle}>Trạng thái nội dung</p>
                  <p className={dashboardStyles.suggestionDesc}>
                    Đang có {draftCourses} khóa học ở trạng thái draft và {publishedCourses} khóa đã publish.
                  </p>
                </div>
              </div>
            </div>

            <div className={dashboardStyles.discussionCard}>
              <h3>Tình hình bài thi</h3>
              <div className={dashboardStyles.discussion}>
                <span className={dashboardStyles.discussionIcon}>Bài thi</span>
                <div>
                  <p className={dashboardStyles.discussionTitle}>{exams.length} bài thi đã tạo</p>
                  <p className={dashboardStyles.discussionDesc}>
                    {latestExam
                      ? `Bài thi mới nhất: ${latestExam.title}`
                      : 'Chưa có bài thi. Hãy tạo bộ đề đầu tiên cho khóa học của bạn.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </TeacherShell>
  );
}
