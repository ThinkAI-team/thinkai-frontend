'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dashboardStyles from '../../dashboard/page.module.css';
import MainSidebar from '../../components/MainSidebar';
import Button from '@/components/ui/Button';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
const POLL_INTERVAL = 3000;
const MAX_POLLS = 20;

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pollCountRef = useRef(0);
  const confirmedRef = useRef(false);
  
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const orderCode = searchParams.get('orderCode');
    const status = searchParams.get('status');
    
    if (orderCode && status === 'PAID') {
      confirmPayment(orderCode);
    } else if (orderCode) {
      // PayOS redirect nhưng status không phải PAID
      setLoading(false);
      setErrorMsg('Thanh toán chưa hoàn tất hoặc đã bị hủy.');
    } else {
      setLoading(false);
      setErrorMsg('Không tìm thấy thông tin thanh toán.');
    }
  }, [searchParams]);

  const confirmPayment = async (orderCode: string) => {
    if (confirmedRef.current) return;
    confirmedRef.current = true;
    
    const token = localStorage.getItem('thinkai_access_token');
    console.log('[PaymentSuccess] Confirming orderCode:', orderCode, 'token exists:', !!token);
    
    try {
      // Gọi API confirm → backend check PayOS API → enroll user
      const response = await fetch(`${API_BASE}/api/v1/payments/confirm/${orderCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('[PaymentSuccess] Confirm response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        const paymentStatus = data.data?.status;
        console.log('[PaymentSuccess] Payment status:', paymentStatus, 'data:', data);
        
        if (paymentStatus === 'COMPLETED') {
          setEnrolled(true);
          setCourseTitle(data.data?.courseTitle || '');
          setCourseId(data.data?.courseId || null);
          setLoading(false);
          return;
        }
      } else {
        const errorText = await response.text();
        console.error('[PaymentSuccess] Confirm error:', response.status, errorText);
      }
      
      // Nếu chưa COMPLETED, bắt đầu polling
      pollPaymentStatus(orderCode);
      
    } catch (error) {
      console.error('Confirm error:', error);
      pollPaymentStatus(orderCode);
    }
  };

  const pollPaymentStatus = async (orderCode: string) => {
    pollCountRef.current += 1;
    
    if (pollCountRef.current > MAX_POLLS) {
      setLoading(false);
      setErrorMsg('Đã hết thời gian kiểm tra. Vui lòng liên hệ hỗ trợ nếu đã thanh toán.');
      return;
    }

    const token = localStorage.getItem('thinkai_access_token');

    try {
      const response = await fetch(`${API_BASE}/api/v1/payments/${orderCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.status === 'COMPLETED') {
          setEnrolled(true);
          setCourseTitle(data.data?.courseTitle || '');
          setCourseId(data.data?.courseId || null);
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error('Poll error:', error);
    }

    setTimeout(() => pollPaymentStatus(orderCode), POLL_INTERVAL);
  };

  const handleCheckAgain = () => {
    const orderCode = searchParams.get('orderCode');
    if (orderCode) {
      confirmedRef.current = false;
      pollCountRef.current = 0;
      setLoading(true);
      setErrorMsg('');
      confirmPayment(orderCode);
    }
  };

  if (loading) {
    return (
      <div className={dashboardStyles.container}>
        <MainSidebar active="payment" />
        <main className={dashboardStyles.main}>
          <div style={inlineStyles.centerContent}>
            <div style={inlineStyles.spinner}></div>
            <div style={inlineStyles.title}>Đang xác nhận thanh toán...</div>
            <div style={inlineStyles.subtitle}>Vui lòng chờ trong giây lát</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={dashboardStyles.container}>
      <MainSidebar active="payment" />
      <main className={dashboardStyles.main}>
        <div style={inlineStyles.successOverlay}>
          <div style={inlineStyles.successCard}>
            <div style={{
              ...inlineStyles.successIcon,
              background: enrolled ? 'var(--accent)' : '#e74c3c'
            }}>
              {enrolled ? '✓' : '!'}
            </div>
            
            <h1 style={inlineStyles.successTitle}>
              {enrolled ? 'Thanh toán thành công!' : 'Chờ xác nhận thanh toán'}
            </h1>
            
            <p style={inlineStyles.successMessage}>
              {enrolled 
                ? `Bạn đã đăng ký khóa học "${courseTitle}" thành công.`
                : errorMsg || 'Giao dịch đang được xử lý. Vui lòng kiểm tra lại.'}
            </p>
            
            <div style={inlineStyles.successActions}>
              {enrolled ? (
                <>
                  {courseId ? (
                    <Button variant="primary" size="lg" onClick={() => router.push(`/courses/${courseId}`)}>
                      Xem chi tiết khóa học →
                    </Button>
                  ) : (
                    <Button variant="primary" size="lg" onClick={() => router.push('/my-courses')}>
                      Vào khóa học của tôi →
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => router.push('/courses')}>
                    Xem thêm khóa học
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="primary" size="lg" onClick={handleCheckAgain}>
                    Kiểm tra lại
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => router.push('/courses')}>
                    Về danh sách khóa học
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const inlineStyles = {
  centerContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
  } as React.CSSProperties,
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid var(--line-soft)',
    borderTopColor: 'var(--accent)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  } as React.CSSProperties,
  title: { fontSize: '1.2rem', marginBottom: '8px' } as React.CSSProperties,
  subtitle: { color: 'var(--text-secondary)' } as React.CSSProperties,
  successOverlay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
  } as React.CSSProperties,
  successCard: {
    background: 'var(--surface)',
    borderRadius: '24px',
    padding: '48px',
    textAlign: 'center' as const,
    maxWidth: '480px',
    width: '100%',
  } as React.CSSProperties,
  successIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    color: 'white',
    fontSize: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  } as React.CSSProperties,
  successTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '12px',
  } as React.CSSProperties,
  successMessage: {
    fontSize: '16px',
    color: 'var(--text-secondary)',
    marginBottom: '32px',
    lineHeight: '1.6',
  } as React.CSSProperties,
  successActions: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    alignItems: 'center',
  } as React.CSSProperties,
};
