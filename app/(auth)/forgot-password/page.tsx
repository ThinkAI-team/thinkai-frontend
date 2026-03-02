'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import Button from '@/components/ui/Button';
import { forgotPassword } from '@/services/auth';
import { ApiException } from '@/services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await forgotPassword(email);
      setSuccess(result.message);
      setEmail('');
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
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
            <span className={styles.logoIcon}>🎯</span>
            <span className={styles.logoText}>ThinkAI</span>
          </Link>

          {/* Header */}
          <div className={styles.welcome}>
            <h1>
              <em>Quên</em> <span className={styles.highlight}>mật khẩu?</span>
            </h1>
            <p>Nhập email đã đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu cho bạn.</p>
          </div>

          {/* Success */}
          {success && (
            <div className={styles.successAlert}>
              <span>✉️</span> {success}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className={styles.errorAlert}>{error}</div>
          )}

          {/* Form */}
          {!success ? (
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  placeholder="ban@email.com"
                  className={styles.input}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  required
                />
              </div>

              <Button
                variant="primary"
                size="lg"
                className={styles.submitBtn}
                type="submit"
                disabled={loading}
              >
                {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu →'}
              </Button>
            </form>
          ) : (
            <div className={styles.successActions}>
              <p className={styles.successHint}>
                Kiểm tra hộp thư email (bao gồm thư mục Spam). Link sẽ hết hạn sau 30 phút.
              </p>
              <button
                className={styles.resendBtn}
                onClick={() => setSuccess('')}
              >
                Gửi lại email
              </button>
            </div>
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
            <span>🎯</span> ThinkAI Assistant
          </div>
          <div className={styles.quote}>
            <div className={styles.quoteLine}></div>
            <p className={styles.quoteText}>&quot;Mỗi ngày đều là<br/>cơ hội mới.&quot;</p>
            <p className={styles.quoteSubtext}>KHÔNG BAO GIỜ LÀ QUÁ MUỘN</p>
          </div>
        </div>
      </div>
    </div>
  );
}
