'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { logout } from '@/services/auth';
import Button from '@/components/ui/Button';
import NotificationBell from '@/components/notifications/NotificationBell';
import dashboardStyles from '../dashboard/page.module.css';
import styles from './MainSidebar.module.css';

type SidebarKey = 'dashboard' | 'courses' | 'exams' | 'ai-tutor' | 'my-courses' | 'cart' | 'payment' | 'profile' | 'settings';

interface SidebarUser {
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface MainSidebarProps {
  active: SidebarKey;
}

function navClass(active: SidebarKey, target: SidebarKey): string {
  return active === target
    ? `${dashboardStyles.navItem} ${dashboardStyles.active}`
    : dashboardStyles.navItem;
}

function roleLabel(role?: string): string {
  const normalizedRole = (role || '').replace(/^ROLE_/, '').toUpperCase();
  if (normalizedRole === 'TEACHER') return 'Giảng viên';
  if (normalizedRole === 'ADMIN') return 'Quản trị viên';
  return 'Sinh viên';
}

export default function MainSidebar({ active }: MainSidebarProps) {
  const router = useRouter();
  const [user, setUser] = useState<SidebarUser | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('user');
    if (!stored) return;
    try {
      setUser(JSON.parse(stored));
    } catch {
      setUser(null);
    }
  }, []);

  const getInitial = () => {
    return user?.fullName ? user.fullName.charAt(0).toUpperCase() : '?';
  };

  const normalizedRole = (user?.role || '').replace(/^ROLE_/, '').toUpperCase();
  const dashboardPath = normalizedRole === 'ADMIN'
    ? '/admin'
    : normalizedRole === 'TEACHER'
      ? '/teacher'
      : '/dashboard';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const mobileNavClass = (target: SidebarKey): string =>
    active === target ? `${styles.mobileNavItem} ${styles.mobileNavItemActive}` : styles.mobileNavItem;

  return (
    <>
      <aside className={dashboardStyles.sidebar}>
        <div className={dashboardStyles.sidebarContent}>
          <Link href="/" className={dashboardStyles.logo}>
            <span className={dashboardStyles.logoText}>ThinkAI</span>
          </Link>

          <nav className={dashboardStyles.nav}>
            <Link
              href={dashboardPath}
              className={navClass(active, 'dashboard')}
              aria-current={active === 'dashboard' ? 'page' : undefined}
            >
              Tổng quan
            </Link>
            <Link href="/courses" className={navClass(active, 'courses')} aria-current={active === 'courses' ? 'page' : undefined}>
              Khóa học
            </Link>
            <Link href="/exams" className={navClass(active, 'exams')} aria-current={active === 'exams' ? 'page' : undefined}>
              Luyện thi
            </Link>
            <Link href="/ai-tutor" className={navClass(active, 'ai-tutor')} aria-current={active === 'ai-tutor' ? 'page' : undefined}>
              BiliBily
            </Link>
            <Link href="/my-courses" className={navClass(active, 'my-courses')} aria-current={active === 'my-courses' ? 'page' : undefined}>
              Khóa học của tôi
            </Link>
            <Link href="/cart" className={navClass(active, 'cart')} aria-current={active === 'cart' ? 'page' : undefined}>
              Giỏ hàng
            </Link>
            <Link href="/profile" className={navClass(active, 'profile')} aria-current={active === 'profile' ? 'page' : undefined}>
              Hồ sơ
            </Link>
            <Link href="/settings" className={navClass(active, 'settings')} aria-current={active === 'settings' ? 'page' : undefined}>
              Cài đặt
            </Link>
          </nav>

          <div className={styles.userSection}>
            <div style={{ marginBottom: '8px' }}>
              <NotificationBell />
            </div>
            <Link href="/profile" className={`${dashboardStyles.userProfile} ${styles.profileLink}`}>
              <div className={dashboardStyles.avatar}>
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.fullName || 'Avatar'}
                    width={40}
                    height={40}
                    unoptimized
                  />
                ) : (
                  getInitial()
                )}
              </div>
              <div className={styles.userInfo}>
                <p className={dashboardStyles.userName}>{user?.fullName || 'Người dùng'}</p>
                <p className={dashboardStyles.userRole}>{roleLabel(user?.role)}</p>
              </div>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              className={styles.logoutBtn}
              onClick={handleLogout}
              title="Đăng xuất"
            >
              Đăng xuất
            </Button>
          </div>
        </div>
      </aside>

      <nav className={styles.mobileNav} aria-label="Điều hướng nhanh">
        <Link
          href={dashboardPath}
          className={mobileNavClass('dashboard')}
          aria-current={active === 'dashboard' ? 'page' : undefined}
        >
          Tổng quan
        </Link>
        <Link
          href="/courses"
          className={mobileNavClass('courses')}
          aria-current={active === 'courses' ? 'page' : undefined}
        >
          Khóa học
        </Link>
        <Link
          href="/exams"
          className={mobileNavClass('exams')}
          aria-current={active === 'exams' ? 'page' : undefined}
        >
          Luyện thi
        </Link>
        <Link
          href="/ai-tutor"
          className={mobileNavClass('ai-tutor')}
          aria-current={active === 'ai-tutor' ? 'page' : undefined}
        >
          BiliBily
        </Link>
        <Link
          href="/profile"
          className={mobileNavClass('profile')}
          aria-current={active === 'profile' ? 'page' : undefined}
        >
          Hồ sơ
        </Link>
        <Link
          href="/cart"
          className={mobileNavClass('cart')}
          aria-current={active === 'cart' ? 'page' : undefined}
        >
          Giỏ hàng
        </Link>
        <Link
          href="/settings"
          className={mobileNavClass('settings')}
          aria-current={active === 'settings' ? 'page' : undefined}
        >
          Cài đặt
        </Link>
      </nav>
    </>
  );
}
