import Link from 'next/link';
import styles from './page.module.css';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
  return (
    <div className={styles.container}>
      {/* Left Side - Form */}
      <div className={styles.formSide}>
        <div className={styles.formContent}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>🎯</span>
            <span className={styles.logoText}>ThinkAI</span>
          </Link>

          {/* Welcome */}
          <div className={styles.welcome}>
            <h1>
              <em>Bắt đầu</em> <span className={styles.highlight}>hành trình</span>
            </h1>
            <p>Đăng ký tài khoản để trải nghiệm học tập thông minh với AI.</p>
          </div>

          {/* Form */}
          <form className={styles.form}>
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="firstName">Họ</label>
                <input 
                  type="text" 
                  id="firstName" 
                  placeholder="Nguyễn" 
                  className={styles.input}
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="lastName">Tên</label>
                <input 
                  type="text" 
                  id="lastName" 
                  placeholder="Văn A" 
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                placeholder="ban@email.com" 
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">Mật khẩu</label>
              <input 
                type="password" 
                id="password" 
                placeholder="Tối thiểu 8 ký tự" 
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <input 
                type="password" 
                id="confirmPassword" 
                placeholder="Nhập lại mật khẩu" 
                className={styles.input}
              />
            </div>

            <div className={styles.checkbox}>
              <input type="checkbox" id="terms" />
              <label htmlFor="terms">
                Tôi đồng ý với <Link href="/terms">Điều khoản sử dụng</Link> và <Link href="/privacy">Chính sách bảo mật</Link>
              </label>
            </div>

            <Button variant="primary" size="lg" className={styles.submitBtn}>
              Tạo tài khoản →
            </Button>
          </form>

          {/* Divider */}
          <div className={styles.divider}>
            <span>hoặc</span>
          </div>

          {/* Google Login */}
          <button className={styles.googleBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Đăng ký bằng Google
          </button>

          {/* Login Link */}
          <p className={styles.registerLink}>
            Đã có tài khoản? <Link href="/login"><strong>Đăng nhập</strong></Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className={styles.imageSide}>
        <div className={styles.imageContent}>
          <div className={styles.assistantBadge}>
            <span>🎯</span> ThinkAI Assistant
          </div>
          
          <div className={styles.quote}>
            <div className={styles.quoteLine}></div>
            <p className={styles.quoteText}>"Mỗi ngày một bước<br/>tiến mới."</p>
            <p className={styles.quoteSubtext}>HỌC TẬP KHÔNG GIỚI HẠN</p>
          </div>
        </div>
      </div>
    </div>
  );
}
