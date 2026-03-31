'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import Button from '../ui/Button';
import { logout } from '@/services/auth';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role: string; avatarUrl?: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
      }
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return undefined;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dropdownOpen]);

  const handleLogout = () => {
    logout();
    setUser(null);
    setDropdownOpen(false);
    router.push('/login');
  };

  const getInitial = () => {
    return user?.fullName ? user.fullName.charAt(0).toUpperCase() : '?';
  };

  const normalizedRole = (user?.role || '').replace(/^ROLE_/, '').toUpperCase();
  const dashboardPath = normalizedRole === 'ADMIN'
    ? '/admin'
    : normalizedRole === 'TEACHER'
      ? '/teacher'
      : '/dashboard';

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>ThinkAI</span>
        </Link>

        {/* Navigation Links */}
        <ul className={styles.navLinks}>
          <li><Link href="/courses">Khóa học</Link></li>
          <li><Link href="/exams">Luyện thi</Link></li>
          <li><Link href="/ai-tutor">Bò Trang</Link></li>
          <li><Link href="/payment">Bảng giá</Link></li>
        </ul>

        {/* Auth Section */}
        {user ? (
          <div className={styles.userSection} ref={dropdownRef}>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              className={styles.avatarBtn}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="Menu người dùng"
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
              aria-controls="navbar-user-menu"
            >
              <span className={styles.avatar}>
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.fullName}
                    width={30}
                    height={30}
                    unoptimized
                    className={styles.avatarImg}
                  />
                ) : (
                  getInitial()
                )}
              </span>
              <span className={styles.userName}>{user.fullName}</span>
              <span className={styles.chevron}>▾</span>
            </Button>

            {dropdownOpen && (
              <div className={styles.dropdown} id="navbar-user-menu" role="menu">
                <div className={styles.dropdownHeader}>
                  <span className={styles.dropdownName}>{user.fullName}</span>
                  <span className={styles.dropdownEmail}>{user.email}</span>
                </div>
                <div className={styles.dropdownDivider} />
                <Link
                  href="/profile"
                  className={styles.dropdownItem}
                  onClick={() => setDropdownOpen(false)}
                  role="menuitem"
                >
                  Trang cá nhân
                </Link>
                <Link
                  href={dashboardPath}
                  className={styles.dropdownItem}
                  onClick={() => setDropdownOpen(false)}
                  role="menuitem"
                >
                  Tổng quan
                </Link>
                {(normalizedRole === 'TEACHER' || normalizedRole === 'ADMIN') && (
                  <Link
                    href="/teacher"
                    className={styles.dropdownItem}
                    onClick={() => setDropdownOpen(false)}
                    role="menuitem"
                  >
                    Khu vực giảng viên
                  </Link>
                )}
                {normalizedRole === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className={styles.dropdownItem}
                    onClick={() => setDropdownOpen(false)}
                    role="menuitem"
                  >
                    Quản trị hệ thống
                  </Link>
                )}
                <div className={styles.dropdownDivider} />
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  className={styles.dropdownLogout}
                  onClick={handleLogout}
                  role="menuitem"
                >
                  Đăng xuất
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.authButtons}>
            <Link href="/login">
              <Button variant="secondary">Đăng nhập</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary">Bắt đầu miễn phí →</Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
