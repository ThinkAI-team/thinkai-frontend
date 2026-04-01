'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import type { ProfileResponse } from '@/services/user';
import Button from '@/components/ui/Button';
import dashboardStyles from '../../(main)/dashboard/page.module.css';
import styles from '../page.module.css';

type TeacherNavKey = 'overview' | 'courses' | 'questions' | 'exams';

interface TeacherShellProps {
  profile: ProfileResponse | null;
  activeNav: TeacherNavKey;
  title: string;
  subtitle: string;
  onLogoutAction: () => void;
  onRefreshAction?: () => void;
  notice?: string;
  error?: string;
  children: ReactNode;
  rightSidebar?: ReactNode;
}

function getUserInitial(profile: ProfileResponse | null): string {
  return profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : '?';
}

function navClass(activeNav: TeacherNavKey, target: TeacherNavKey): string {
  return activeNav === target
    ? `${dashboardStyles.navItem} ${dashboardStyles.active}`
    : dashboardStyles.navItem;
}

function mobileNavClass(activeNav: TeacherNavKey, target: TeacherNavKey): string {
  return activeNav === target ? `${styles.mobileNavItem} ${styles.mobileNavItemActive}` : styles.mobileNavItem;
}

export default function TeacherShell({
  profile,
  activeNav,
  title,
  subtitle,
  onLogoutAction,
  onRefreshAction,
  notice,
  error,
  children,
  rightSidebar,
}: TeacherShellProps) {
  return (
    <div className={dashboardStyles.container}>
      <aside className={dashboardStyles.sidebar}>
        <div className={dashboardStyles.sidebarContent}>
          <Link href="/" className={dashboardStyles.logo}>
            <span className={dashboardStyles.logoText}>ThinkAI</span>
          </Link>

          <nav className={dashboardStyles.nav}>
            <Link
              href="/teacher"
              className={navClass(activeNav, 'overview')}
              aria-current={activeNav === 'overview' ? 'page' : undefined}
            >
              Tổng quan
            </Link>
            <Link
              href="/teacher/courses"
              className={navClass(activeNav, 'courses')}
              aria-current={activeNav === 'courses' ? 'page' : undefined}
            >
              Khóa học
            </Link>
            <Link
              href="/teacher/questions"
              className={navClass(activeNav, 'questions')}
              aria-current={activeNav === 'questions' ? 'page' : undefined}
            >
              Ngân hàng câu hỏi
            </Link>
            <Link
              href="/teacher/exams"
              className={navClass(activeNav, 'exams')}
              aria-current={activeNav === 'exams' ? 'page' : undefined}
            >
              Bài thi
            </Link>
            <Link href="/ai-tutor" className={dashboardStyles.navItem}>
              Bò Trang
            </Link>
            <Link href="/settings" className={dashboardStyles.navItem}>
              Cài đặt
            </Link>
          </nav>

          <div className={styles.userSection}>
            <Link href="/profile" className={`${dashboardStyles.userProfile} ${styles.profileLink}`}>
              <div className={dashboardStyles.avatar}>
                {profile?.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.fullName || 'Avatar'}
                    width={40}
                    height={40}
                    unoptimized
                  />
                ) : (
                  getUserInitial(profile)
                )}
              </div>
              <div className={styles.userInfo}>
                <p className={dashboardStyles.userName}>{profile?.fullName || 'Giảng viên'}</p>
                <p className={dashboardStyles.userRole}>Giảng viên</p>
              </div>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              className={styles.logoutBtn}
              onClick={onLogoutAction}
              title="Đăng xuất"
            >
              Đăng xuất
            </Button>
          </div>
        </div>
      </aside>

      <nav className={styles.mobileNav} aria-label="Điều hướng giảng viên">
        <Link
          href="/teacher"
          className={mobileNavClass(activeNav, 'overview')}
          aria-current={activeNav === 'overview' ? 'page' : undefined}
        >
          Tổng quan
        </Link>
        <Link
          href="/teacher/courses"
          className={mobileNavClass(activeNav, 'courses')}
          aria-current={activeNav === 'courses' ? 'page' : undefined}
        >
          Khóa học
        </Link>
        <Link
          href="/teacher/questions"
          className={mobileNavClass(activeNav, 'questions')}
          aria-current={activeNav === 'questions' ? 'page' : undefined}
        >
          Câu hỏi
        </Link>
        <Link
          href="/teacher/exams"
          className={mobileNavClass(activeNav, 'exams')}
          aria-current={activeNav === 'exams' ? 'page' : undefined}
        >
          Bài thi
        </Link>
        <Link href="/settings" className={styles.mobileNavItem}>
          Cài đặt
        </Link>
      </nav>

      <main className={dashboardStyles.main}>
        <header className={dashboardStyles.header}>
          <div className={dashboardStyles.greeting}>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {onRefreshAction && (
            <div className={dashboardStyles.headerActions}>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                className={styles.refreshBtn}
                onClick={onRefreshAction}
              >
                Làm mới
              </Button>
            </div>
          )}
        </header>

        {error && <p className={styles.error}>{error}</p>}
        {notice && <p className={styles.notice}>{notice}</p>}
        {children}
      </main>

      <aside className={dashboardStyles.rightSidebar}>
        {rightSidebar || (
          <div className={dashboardStyles.lessonList}>
            <h3>Khu vực giảng viên</h3>
            <p className={dashboardStyles.lessonCourse}>Các chức năng quản trị đã tách riêng theo từng trang.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
