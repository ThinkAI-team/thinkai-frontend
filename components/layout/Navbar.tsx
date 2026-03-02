'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import Button from '../ui/Button';
import { logout } from '@/services/auth';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role: string } | null>(null);
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

  const handleLogout = () => {
    logout();
    setUser(null);
    setDropdownOpen(false);
    router.push('/login');
  };

  const getInitial = () => {
    return user?.fullName ? user.fullName.charAt(0).toUpperCase() : '?';
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🎯</span>
          <span className={styles.logoText}>ThinkAI</span>
        </Link>

        {/* Navigation Links */}
        <ul className={styles.navLinks}>
          <li><Link href="/courses">Khóa học</Link></li>
          <li><Link href="/exams">Luyện thi</Link></li>
          <li><Link href="/ai-tutor">Gia sư AI</Link></li>
          <li><Link href="/pricing">Bảng giá</Link></li>
        </ul>

        {/* Auth Section */}
        {user ? (
          <div className={styles.userSection} ref={dropdownRef}>
            <button
              className={styles.avatarBtn}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="Menu người dùng"
            >
              <span className={styles.avatar}>{getInitial()}</span>
              <span className={styles.userName}>{user.fullName}</span>
              <span className={styles.chevron}>▾</span>
            </button>

            {dropdownOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownHeader}>
                  <span className={styles.dropdownName}>{user.fullName}</span>
                  <span className={styles.dropdownEmail}>{user.email}</span>
                </div>
                <div className={styles.dropdownDivider} />
                <Link
                  href="/profile"
                  className={styles.dropdownItem}
                  onClick={() => setDropdownOpen(false)}
                >
                  👤 Trang cá nhân
                </Link>
                <Link
                  href="/dashboard"
                  className={styles.dropdownItem}
                  onClick={() => setDropdownOpen(false)}
                >
                  📊 Dashboard
                </Link>
                <div className={styles.dropdownDivider} />
                <button className={styles.dropdownLogout} onClick={handleLogout}>
                  🚪 Đăng xuất
                </button>
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
