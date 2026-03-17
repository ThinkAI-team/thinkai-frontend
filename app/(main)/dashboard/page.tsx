'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import Button from '@/components/ui/Button';
import { logout } from '@/services/auth';
import { usersApi } from '@/lib/api/users';
import type { UserProfile } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await usersApi.getProfile();
        setProfile(data);
      } catch (err) {
        console.error('Failed to load profile:', err);
        // If 401, redirect to login is handled by interceptor but good to have here
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

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

  if (loading) {
    return <div className={styles.loadingContainer}>Đang tải...</div>;
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
            <h1>Chào buổi sáng, <em>{getFirstName()}!</em> 👋</h1>
            <p>Hôm nay là một ngày tuyệt vời để học điều mới.</p>
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
            <div className={styles.statValue}>3</div>
            <div className={styles.statLabel}>KHÓA HỌC</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📈</div>
            <div className={styles.statValue}>65%</div>
            <div className={styles.statLabel}>TIẾN ĐỘ</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📝</div>
            <div className={styles.statValue}>2</div>
            <div className={styles.statLabel}>BÀI KIỂM TRA</div>
          </div>
        </div>

        {/* Continue Learning */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Tiếp tục học</h2>
            <Link href="/courses" className={styles.viewAll}>Xem tất cả →</Link>
          </div>
          
          <div className={styles.courseCard}>
            <div className={styles.courseImage}>
              <span>&lt; &gt;</span>
            </div>
            <div className={styles.courseInfo}>
              <div className={styles.courseMeta}>
                <span className={styles.courseTag}>BACKEND</span>
                <span className={styles.courseTime}>2h 15m còn lại</span>
              </div>
              <h3>Java Spring Boot: Xây dựng API</h3>
              <p>Học cách xây dựng RESTful APIs mạnh m...</p>
              <div className={styles.progressSection}>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{width: '75%'}}></div>
                </div>
                <span className={styles.progressText}>75%</span>
              </div>
            </div>
            <Button variant="primary">Tiếp tục →</Button>
          </div>
        </section>

        {/* Bottom Grid */}
        <div className={styles.bottomGrid}>
          <div className={styles.suggestionCard}>
            <h3>Gợi ý học tập</h3>
            <div className={styles.suggestion}>
              <span className={styles.suggestionIcon}>💡</span>
              <div>
                <p className={styles.suggestionTitle}>Ôn tập kiến thức Database</p>
                <p className={styles.suggestionDesc}>Dựa trên kết quả bài kiểm tra gần đây, bạn nên xem lại về SQL Joins.</p>
              </div>
            </div>
          </div>
          
          <div className={styles.discussionCard}>
            <h3>Thảo luận mới</h3>
            <div className={styles.discussion}>
              <span className={styles.discussionIcon}>💬</span>
              <div>
                <p className={styles.discussionTitle}>Hỏi đáp về Spring Security</p>
                <p className={styles.discussionDesc}>2 tin nhắn mới từ Mentor.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className={styles.rightSidebar}>
        <div className={styles.lessonList}>
          <h3>Danh sách bài học</h3>
          <p className={styles.lessonCourse}>Java Spring Boot</p>
          
          <div className={styles.chapters}>
            <div className={`${styles.chapter} ${styles.completed}`}>
              <span className={styles.chapterCheck}>✓</span>
              <div>
                <p className={styles.chapterNumber}>CHƯƠNG 1</p>
                <p className={styles.chapterTitle}>Giới thiệu về Spring</p>
              </div>
            </div>
            <div className={`${styles.chapter} ${styles.completed}`}>
              <span className={styles.chapterCheck}>✓</span>
              <div>
                <p className={styles.chapterNumber}>CHƯƠNG 2</p>
                <p className={styles.chapterTitle}>Cấu hình môi trường</p>
              </div>
            </div>
            <div className={`${styles.chapter} ${styles.current}`}>
              <span className={styles.chapterCurrent}>○</span>
              <div>
                <p className={styles.chapterNumber}>CHƯƠNG 3 - HIỆN TẠI</p>
                <p className={styles.chapterTitle}>Dependency Injection</p>
                <p className={styles.chapterMeta}>15 phút • Video & Quiz</p>
              </div>
            </div>
            <div className={styles.chapter}>
              <span className={styles.chapterLock}>○</span>
              <div>
                <p className={styles.chapterNumber}>CHƯƠNG 4</p>
                <p className={styles.chapterTitle}>Spring Beans & Scopes</p>
                <p className={styles.chapterMeta}>🔒 Đang khóa</p>
              </div>
            </div>
            <div className={styles.chapter}>
              <span className={styles.chapterLock}>○</span>
              <div>
                <p className={styles.chapterNumber}>CHƯƠNG 5</p>
                <p className={styles.chapterTitle}>Component Scanning</p>
              </div>
            </div>
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
