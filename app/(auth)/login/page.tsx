'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import Button from '@/components/ui/Button';
import { login, googleLogin } from '@/services/auth';
import { ApiException } from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);

  // Khởi tạo Google Identity Services và render nút ẩn
  useEffect(() => {
    const initGoogle = () => {
      if (!(window as any).google || !googleBtnRef.current) return;

      (window as any).google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          setLoading(true);
          setGlobalError('');
          try {
            await googleLogin(response.credential);
            router.push('/dashboard');
          } catch (err: any) {
            console.error('Google login error:', err);
            setGlobalError(err.message || 'Đăng nhập Google thất bại');
            setLoading(false);
          }
        },
      });

      // Render nút Google chính thức vào div
      (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        size: 'large',
        width: googleBtnRef.current.offsetWidth,
        theme: 'outline',
      });
    };

    // Script có thể chưa load xong, thử lại
    if ((window as any).google) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if ((window as any).google) {
          initGoogle();
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
    if (globalError) setGlobalError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');
    setLoading(true);

    try {
      await login(formData);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.fieldErrors) {
          setErrors(err.fieldErrors);
        } else {
          setGlobalError(err.message);
        }
      } else {
        setGlobalError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Không cần handleGoogleClick nữa vì user sẽ click trực tiếp vào nút overlay

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
              <em>Chào mừng</em> <span className={styles.highlight}>trở lại</span>
            </h1>
            <p>Chào mừng quay trở lại! Hãy đăng nhập để tiếp tục hành trình học tập.</p>
          </div>

          {/* Global Error */}
          {globalError && (
            <div className={styles.errorAlert}>{globalError}</div>
          )}

          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                placeholder="ban@email.com"
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="password">Mật khẩu</label>
                <Link href="/forgot-password" className={styles.forgotLink}>
                  Quên mật khẩu?
                </Link>
              </div>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
            </div>

            <Button
              variant="primary"
              size="lg"
              className={styles.submitBtn}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập →'}
            </Button>
          </form>

          {/* Divider */}
          <div className={styles.divider}>
            <span>hoặc</span>
          </div>

          {/* Container cho nút Google - Custom UI bên dưới, Google Button thật bên trên (trong suốt) */}
          <div style={{ position: 'relative', marginTop: '16px' }}>
            {/* Nút Google custom đẹp (View only) */}
            <button
              type="button"
              className={styles.googleBtn}
              tabIndex={-1}
              style={{ pointerEvents: 'none' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Đăng nhập bằng Google
            </button>

            {/* Nút thật của Google đè lên trên và làm trong suốt */}
            <div 
              ref={googleBtnRef} 
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                opacity: 0.01, // Trong suốt gần như hoàn toàn nhưng vẫn nhận click
                overflow: 'hidden',
                cursor: 'pointer'
              }} 
            />
          </div>

          {/* Register Link */}
          <p className={styles.registerLink}>
            Chưa có tài khoản? <Link href="/register"><strong>Đăng ký ngay</strong></Link>
          </p>

          {/* Footer Links */}
          <div className={styles.footerLinks}>
            <Link href="/terms">Điều khoản</Link>
            <span>•</span>
            <Link href="/privacy">Bảo mật</Link>
            <span>•</span>
            <Link href="/help">Trợ giúp</Link>
          </div>
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
            <p className={styles.quoteText}>&quot;Học thông minh hơn<br/>với AI.&quot;</p>
            <p className={styles.quoteSubtext}>NỀN TẢNG GIÁO DỤC THẾ HỆ MỚI</p>
          </div>
        </div>
      </div>
    </div>
  );
}
