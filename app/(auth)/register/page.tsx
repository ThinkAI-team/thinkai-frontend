'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import Button from '@/components/ui/Button';
import { ApiException } from '@/services/api';
import { register, googleLogin } from '@/services/auth';

function getRedirectPathByRole(role?: string): string {
  const normalizedRole = (role || '').replace(/^ROLE_/, '').toUpperCase();
  if (normalizedRole === 'ADMIN') return '/admin';
  if (normalizedRole === 'TEACHER') return '/teacher';
  return '/dashboard';
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT' as 'STUDENT' | 'TEACHER',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  useEffect(() => {
    const roleParam = searchParams.get('role')?.toUpperCase();
    if (roleParam === 'STUDENT' || roleParam === 'TEACHER') {
      setFormData(prev => ({ ...prev, role: roleParam as 'STUDENT' | 'TEACHER' }));
    }
  }, [searchParams]);

  // Khởi tạo Google Identity Services và render nút thật để overlay
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
            console.error('Google register error:', err);
            setGlobalError(err.message || 'Đăng ký Google thất bại');
            setLoading(false);
          }
        },
      });

      (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        size: 'large',
        width: googleBtnRef.current.offsetWidth || 300,
        theme: 'outline',
      });
    };

    if ((window as any).google) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if ((window as any).google) {
          initGoogle();
          clearInterval(interval);
        }
      }, 500);
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

  const handleRoleSelect = (role: 'STUDENT' | 'TEACHER') => {
    setFormData(prev => ({ ...prev, role }));
    if (globalError) setGlobalError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');

    if (!agreeTerms) {
      setGlobalError('Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
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

  return (
    <div className={styles.container}>
      {/* Left Side - Form */}
      <div className={styles.formSide}>
        <div className={styles.formContent}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>🎯</span>
            <span className={styles.logoText}>ThinkAI</span>
          </Link>

          <div className={styles.welcome}>
            <h1>
              <em>Bắt đầu</em> <span className={styles.highlight}>hành trình</span>
            </h1>
            <p>Đăng ký tài khoản để trải nghiệm học tập thông minh với AI.</p>
          </div>

          {globalError && (
            <div className={styles.errorAlert}>{globalError}</div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.roleSelection}>
              <div 
                className={`${styles.roleCard} ${formData.role === 'STUDENT' ? styles.roleActive : ''}`}
                onClick={() => handleRoleSelect('STUDENT')}
              >
                <div className={styles.roleIcon}>🎯</div>
                <div className={styles.roleInfo}>
                  <span className={styles.roleTitle}>Tôi là Học sinh</span>
                  <span className={styles.roleDesc}>Muốn nâng tầm kiến thức</span>
                </div>
                {formData.role === 'STUDENT' && <div className={styles.checkMark}>✓</div>}
              </div>

              <div 
                className={`${styles.roleCard} ${formData.role === 'TEACHER' ? styles.roleActive : ''}`}
                onClick={() => handleRoleSelect('TEACHER')}
              >
                <div className={styles.roleIcon}>🎓</div>
                <div className={styles.roleInfo}>
                  <span className={styles.roleTitle}>Tôi là Giảng viên</span>
                  <span className={styles.roleDesc}>Chia sẻ kiến thức bổ ích</span>
                </div>
                {formData.role === 'TEACHER' && <div className={styles.checkMark}>✓</div>}
              </div>
            </div>

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="firstName">Họ</label>
                <input type="text" id="firstName" placeholder="Nguyễn"
                  className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`}
                  value={formData.firstName} onChange={handleChange} />
                {errors.firstName && <span className={styles.fieldError}>{errors.firstName}</span>}
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="lastName">Tên</label>
                <input type="text" id="lastName" placeholder="Văn A"
                  className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`}
                  value={formData.lastName} onChange={handleChange} />
                {errors.lastName && <span className={styles.fieldError}>{errors.lastName}</span>}
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input type="email" id="email" placeholder="ban@email.com"
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                value={formData.email} onChange={handleChange} />
              {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">Mật khẩu</label>
              <input type="password" id="password" placeholder="Tối thiểu 8 ký tự"
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                value={formData.password} onChange={handleChange} />
              {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <input type="password" id="confirmPassword" placeholder="Nhập lại mật khẩu"
                className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                value={formData.confirmPassword} onChange={handleChange} />
              {errors.confirmPassword && <span className={styles.fieldError}>{errors.confirmPassword}</span>}
            </div>

            <div className={styles.checkbox}>
              <input type="checkbox" id="terms" checked={agreeTerms}
                onChange={(e) => { setAgreeTerms(e.target.checked); if (globalError) setGlobalError(''); }} />
              <label htmlFor="terms">
                Tôi đồng ý với <Link href="/terms">Điều khoản sử dụng</Link> và <Link href="/privacy">Chính sách bảo mật</Link>
              </label>
            </div>

            <Button variant="primary" size="lg" className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản →'}
            </Button>
          </form>

          <div className={styles.divider}>
            <span>hoặc</span>
          </div>

          <div style={{ position: 'relative', marginTop: '16px' }}>
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
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Đăng ký bằng Google
            </button>

            <div 
              ref={googleBtnRef} 
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                opacity: 0.01, 
                overflow: 'hidden',
                cursor: 'pointer'
              }} 
            />
          </div>

          <p className={styles.registerLink}>
            Đã có tài khoản? <Link href="/login"><strong>Đăng nhập</strong></Link>
          </p>
        </div>
      </div>

      <div className={styles.imageSide}>
        <div className={styles.imageContent}>
          <div className={styles.assistantBadge}>
            <span>🎯</span> ThinkAI Assistant
          </div>
          <div className={styles.quote}>
            <div className={styles.quoteLine}></div>
            <p className={styles.quoteText}>&quot;Mỗi ngày một bước<br/>tiến mới.&quot;</p>
            <p className={styles.quoteSubtext}>HỌC TẬP KHÔNG GIỚI HẠN</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
