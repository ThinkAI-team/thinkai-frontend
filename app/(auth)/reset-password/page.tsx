'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import Button from '@/components/ui/Button';
import { resetPassword } from '@/services/auth';
import { ApiException } from '@/services/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // No token → invalid link
  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.formSide}>
          <div className={styles.formContent}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoText}>ThinkAI</span>
            </Link>
            <div className={styles.errorState}>
              <h2>Link không hợp lệ</h2>
              <p>Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
              <Link href="/forgot-password">
                <Button variant="primary" size="lg">Yêu cầu link mới →</Button>
              </Link>
            </div>
          </div>
        </div>
        <div className={styles.imageSide}>
          <div className={styles.imageContent}>
            <div className={styles.assistantBadge}>
              ThinkAI Assistant
            </div>
            <div className={styles.quote}>
              <div className={styles.quoteLine}></div>
              <p className={styles.quoteText}>&quot;Kiên trì là chìa<br/>khóa thành công.&quot;</p>
              <p className={styles.quoteSubtext}>HỌC TẬP KHÔNG GIỚI HẠN</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
    if (globalError) setGlobalError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');
    setLoading(true);

    try {
      const result = await resetPassword(token, formData.newPassword, formData.confirmPassword);
      setSuccess(result.message);
      // Redirect to login after 3 seconds
      setTimeout(() => router.push('/login'), 3000);
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
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <span className={styles.logoText}>ThinkAI</span>
          </Link>

          {/* Header */}
          <div className={styles.welcome}>
            <h1>
              <em>Đặt lại</em> <span className={styles.highlight}>mật khẩu</span>
            </h1>
            <p>Nhập mật khẩu mới cho tài khoản của bạn.</p>
          </div>

          {/* Success */}
          {success && (
            <div className={styles.successAlert}>
              {success}
              <p className={styles.redirectHint}>Đang chuyển về trang đăng nhập...</p>
            </div>
          )}

          {/* Error */}
          {globalError && (
            <div className={styles.errorAlert}>{globalError}</div>
          )}

          {/* Form */}
          {!success && (
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label htmlFor="newPassword">Mật khẩu mới</label>
                <input
                  type="password"
                  id="newPassword"
                  placeholder="Tối thiểu 8 ký tự"
                  className={`${styles.input} ${errors.newPassword ? styles.inputError : ''}`}
                  value={formData.newPassword}
                  onChange={handleChange}
                />
                {errors.newPassword && <span className={styles.fieldError}>{errors.newPassword}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder="Nhập lại mật khẩu mới"
                  className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                {errors.confirmPassword && <span className={styles.fieldError}>{errors.confirmPassword}</span>}
              </div>

              <Button
                variant="primary"
                size="lg"
                className={styles.submitBtn}
                type="submit"
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu →'}
              </Button>
            </form>
          )}

          {/* Back to Login */}
          <p className={styles.backLink}>
            <Link href="/login">← Quay lại đăng nhập</Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className={styles.imageSide}>
        <div className={styles.imageContent}>
          <div className={styles.assistantBadge}>
            ThinkAI Assistant
          </div>
          <div className={styles.quote}>
            <div className={styles.quoteLine}></div>
            <p className={styles.quoteText}>&quot;Kiên trì là chìa<br/>khóa thành công.&quot;</p>
            <p className={styles.quoteSubtext}>HỌC TẬP KHÔNG GIỚI HẠN</p>
          </div>
        </div>
      </div>
    </div>
  );
}
