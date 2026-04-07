'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dashboardStyles from '../../dashboard/page.module.css';
import MainSidebar from '../../components/MainSidebar';
import styles from '../page.module.css';

export default function PaymentCancelPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderCode = searchParams.get('orderCode');
  const status = searchParams.get('status');

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/cart');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className={`${dashboardStyles.container} ${styles.container}`}>
      <MainSidebar active="payment" />
      <main className={`${dashboardStyles.main} ${styles.main}`}>
        <div className={styles.successOverlay}>
          <div className={styles.successCard}>
            <div className={styles.successIcon} style={{ background: '#e74c3c' }}>✕</div>
            <h1 className={styles.successTitle}>Thanh toán đã bị hủy</h1>
            <p className={styles.successMessage}>
              Đơn hàng {orderCode ? `#${orderCode}` : ''} đã được hủy bởi bạn.
            </p>
            <p className={styles.successSub}>
              Bạn sẽ được chuyển về giỏ hàng trong giây lát...
            </p>
            <div className={styles.successActions}>
              <button
                className={styles.successBtn}
                onClick={() => router.push('/cart')}
                style={{ background: 'var(--accent)' }}
              >
                ← Quay về giỏ hàng
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}