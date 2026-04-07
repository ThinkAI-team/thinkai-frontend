import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Top Section */}
        <div className={styles.topSection}>
          {/* Brand */}
          <div className={styles.brand}>
            <div className={styles.logo}>
              <span className={styles.logoText}>ThinkAI</span>
            </div>
            <p className={styles.tagline}>
              Nền tảng học Tiếng Anh thông minh.<br/>
              Luyện thi TOEIC/IELTS với BiliBily 24/7.
            </p>
          </div>

          {/* Links */}
          <div className={styles.linksGrid}>
            <div className={styles.linkColumn}>
              <h4>Sản phẩm</h4>
              <ul>
                <li><Link href="/courses">Khóa học</Link></li>
                <li><Link href="/exams">Luyện thi</Link></li>
                <li><Link href="/ai-tutor">BiliBily</Link></li>
              </ul>
            </div>
            <div className={styles.linkColumn}>
              <h4>Công ty</h4>
              <ul>
                <li><Link href="/about">Về chúng tôi</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/contact">Liên hệ</Link></li>
              </ul>
            </div>
            <div className={styles.linkColumn}>
              <h4>Hỗ trợ</h4>
              <ul>
                <li><Link href="/faq">FAQ</Link></li>
                <li><Link href="/privacy">Chính sách bảo mật</Link></li>
                <li><Link href="/terms">Điều khoản sử dụng</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={styles.bottomSection}>
          <p>© 2026 ThinkAI. Đồ án tốt nghiệp.</p>
        </div>
      </div>
    </footer>
  );
}
