'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import Button from '@/components/ui/Button';
import { logout } from '@/services/auth';
import { getProfile, type ProfileResponse } from '@/services/user';
import { getDashboard, type DashboardData } from '@/services/dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, dashboardData] = await Promise.all([
          getProfile(),
          getDashboard(),
        ]);
        setProfile(profileData);
        setDashboard(dashboardData);
      } catch (err) {
        setError('Không thể tải dữ liệu dashboard. Vui lòng đăng nhập lại.');
        setTimeout(() => router.push('/login'), 1200);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getUserInitial = () => {
    return profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : '?';
  };

  const getFirstName = () => {
    return profile?.fullName ? profile.fullName.split(' ')[0] : 'bạn';
  };

  const completedLessons = dashboard?.enrolledCourses.reduce(
    (sum, course) => sum + course.completedLessons,
    0
  ) || 0;

  const nextLessonHref = dashboard?.nextLesson
    ? `/learn/${dashboard.nextLesson.lessonId}`
    : '/courses';

  const firstCourse = dashboard?.enrolledCourses[0];

  if (loading) {
    return <div className={styles.loadingContainer}>Đang tải...</div>;
  }

  if (error) {
    return <div className={styles.loadingContainer}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarContent}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>🎯</span>
            <span className={styles.logoText}>ThinkAI</span>
          </Link>

          {/* Navigation */}
          <nav className={styles.nav}>
            <Link href="/dashboard" className={`${styles.navItem} ${styles.active}`}>
              <span className={styles.navIcon}>📊</span>
              Tổng quan
            </Link>
            <Link href="/courses" className={styles.navItem}>
              <span className={styles.navIcon}>📚</span>
              Khóa học của tôi
            </Link>
            <Link href="/exams" className={styles.navItem}>
              <span className={styles.navIcon}>📝</span>
              Kỳ thi
            </Link>
            <Link href="/ai-tutor" className={styles.navItem}>
              <span className={styles.navIcon}>🤖</span>
              Gia sư AI
            </Link>
            <Link href="/settings" className={styles.navItem}>
              <span className={styles.navIcon}>⚙️</span>
              Cài đặt
            </Link>
          </nav>

          {/* User Profile */}
          <div className={styles.userSection}>
            <Link href="/profile" className={styles.userProfile} style={{ textDecoration: 'none' }}>
              <div className={styles.avatar}>
                {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="Avatar" /> : getUserInitial()}
              </div>
              <div className={styles.userInfo}>
                <p className={styles.userName}>{profile?.fullName || 'Người dùng'}</p>
                <p className={styles.userRole}>{profile?.role === 'STUDENT' ? 'Sinh viên' : profile?.role === 'TEACHER' ? 'Giảng viên' : profile?.role || 'Học viên'}</p>
              </div>
            </Link>
            <button className={styles.logoutBtn} onClick={handleLogout} title="Đăng xuất">
              <span className={styles.logoutIcon}>🚪</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.greeting}>
            <h1>
              {dashboard?.greeting || (
                <>Chào mừng quay lại, <em>{getFirstName()}!</em></>
              )}
            </h1>
            <p>Theo dõi tiến độ và tiếp tục bài học tiếp theo của bạn.</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.iconBtn}>🔔</button>
            <button className={styles.iconBtn}>🌙</button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📚</div>
            <div className={styles.statValue}>{dashboard?.totalEnrolledCourses || 0}</div>
            <div className={styles.statLabel}>KHÓA HỌC</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📈</div>
            <div className={styles.statValue}>{Math.round(dashboard?.averageProgress || 0)}%</div>
            <div className={styles.statLabel}>TIẾN ĐỘ</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📝</div>
            <div className={styles.statValue}>{completedLessons}</div>
            <div className={styles.statLabel}>BÀI ĐÃ HOÀN THÀNH</div>
          </div>
        </div>

        {/* Continue Learning */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Tiếp tục học</h2>
            <Link href="/courses" className={styles.viewAll}>Xem tất cả →</Link>
          </div>
          
          {firstCourse ? (
            <div className={styles.courseCard}>
              <div className={styles.courseImage}>
                <span>&lt; / &gt;</span>
              </div>
              <div className={styles.courseInfo}>
                <div className={styles.courseMeta}>
                  <span className={styles.courseTag}>ĐANG HỌC</span>
                  <span className={styles.courseTime}>
                    {firstCourse.completedLessons}/{firstCourse.totalLessons} bài
                  </span>
                </div>
                <h3>{firstCourse.title}</h3>
                <p>Tiếp tục bài học để hoàn thành tiến độ của khóa học.</p>
                <div className={styles.progressSection}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${Math.round(firstCourse.progressPercent || 0)}%` }}
                    />
                  </div>
                  <span className={styles.progressText}>
                    {Math.round(firstCourse.progressPercent || 0)}%
                  </span>
                </div>
              </div>
              <Link href={nextLessonHref}>
                <Button variant="primary">Tiếp tục →</Button>
              </Link>
            </div>
          ) : (
            <div className={styles.courseCard}>
              <div className={styles.courseInfo}>
                <h3>Bạn chưa đăng ký khóa học nào</h3>
                <p>Khám phá các khóa học để bắt đầu hành trình học tập.</p>
              </div>
              <Link href="/courses">
                <Button variant="primary">Khám phá khóa học →</Button>
              </Link>
            </div>
          )}
        </section>

        {/* Bottom Grid */}
        <div className={styles.bottomGrid}>
          <div className={styles.suggestionCard}>
            <h3>Gợi ý học tập</h3>
            <div className={styles.suggestion}>
              <span className={styles.suggestionIcon}>💡</span>
              <div>
                <p className={styles.suggestionTitle}>Bài học tiếp theo</p>
                <p className={styles.suggestionDesc}>
                  {dashboard?.nextLesson
                    ? `${dashboard.nextLesson.lessonTitle} (${dashboard.nextLesson.courseTitle})`
                    : 'Bạn đã hoàn thành các bài đang theo học. Tiếp tục học khóa mới.'}
                </p>
              </div>
            </div>
          </div>
          
          <div className={styles.discussionCard}>
            <h3>Tiến độ trung bình</h3>
            <div className={styles.discussion}>
              <span className={styles.discussionIcon}>📊</span>
              <div>
                <p className={styles.discussionTitle}>
                  {Math.round(dashboard?.averageProgress || 0)}% hoàn thành
                </p>
                <p className={styles.discussionDesc}>
                  Duy trì đều đặn để hoàn thành mục tiêu học tập tuần này.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className={styles.rightSidebar}>
        <div className={styles.lessonList}>
          <h3>Khóa học đã đăng ký</h3>
          <p className={styles.lessonCourse}>Theo dõi nhanh tiến độ</p>
          
          <div className={styles.chapters}>
            {(dashboard?.enrolledCourses || []).slice(0, 5).map((course) => (
              <div
                key={course.courseId}
                className={`${styles.chapter} ${course.progressPercent >= 100 ? styles.completed : styles.current}`}
              >
                <span className={styles.chapterCheck}>
                  {course.progressPercent >= 100 ? '✓' : '○'}
                </span>
                <div>
                  <p className={styles.chapterNumber}>KHÓA HỌC #{course.courseId}</p>
                  <p className={styles.chapterTitle}>{course.title}</p>
                  <p className={styles.chapterMeta}>
                    {course.completedLessons}/{course.totalLessons} bài • {Math.round(course.progressPercent)}%
                  </p>
                </div>
              </div>
            ))}
            {!dashboard?.enrolledCourses.length && (
              <div className={styles.chapter}>
                <span className={styles.chapterLock}>○</span>
                <div>
                  <p className={styles.chapterTitle}>Chưa có dữ liệu khóa học</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Calendar */}
        <div className={styles.calendar}>
          <div className={styles.calendarHeader}>
            <h4>Tháng 10</h4>
            <Link href="/calendar" className={styles.viewCalendar}>Xem lịch</Link>
          </div>
          <div className={styles.calendarGrid}>
            <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
            <span>25</span><span>26</span><span className={styles.today}>27</span><span>28</span><span className={styles.deadline}>29</span><span>30</span><span>1</span>
          </div>
          <div className={styles.calendarLegend}>
            <span>● Hôm nay</span>
            <span>○ Deadline</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
