'use client';

import Link from 'next/link';
import styles from './Navbar.module.css';
import Button from '../ui/Button';

export default function Navbar() {
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

        {/* Auth Buttons */}
        <div className={styles.authButtons}>
          <Link href="/login">
            <Button variant="secondary">Đăng nhập</Button>
          </Link>
          <Link href="/register">
            <Button variant="primary">Bắt đầu miễn phí →</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
