'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dashboardStyles from '../dashboard/page.module.css';
import MainSidebar from '../components/MainSidebar';
import styles from './page.module.css';
import Button from '@/components/ui/Button';
import { formatVnd } from '@/lib/utils/format';
import { createHarnessSubscriptionPaymentLink } from '@/services/subscription';

const HARNESS_MONTHLY_PRICE_VND = 26000;

export default function SubscriptionPage() {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    setPaying(true);
    setError('');
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const payment = await createHarnessSubscriptionPaymentLink({
        planCode: 'harness-monthly',
        amountVnd: HARNESS_MONTHLY_PRICE_VND,
        returnUrl: `${origin}/subscription/success`,
        cancelUrl: `${origin}/subscription/cancel`,
      });

      if (payment.checkoutUrl) {
        window.location.href = payment.checkoutUrl;
        return;
      }
      setError('Không nhận được checkout URL từ PayOS.');
    } catch (err: any) {
      setError(err?.message || 'Không thể tạo thanh toán Harness lúc này.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className={`${dashboardStyles.container} ${styles.container}`}>
      <MainSidebar active="payment" />
      <main className={`${dashboardStyles.main} ${styles.main}`}>
        <section className={styles.hero}>
          <h1>Harness Subscription</h1>
          <p>Mở khóa toàn bộ trải nghiệm Harness agent với gói theo tháng.</p>
        </section>

        {error && <p className={styles.errorText}>{error}</p>}

        <section className={styles.grid}>
          <article className={styles.planCard}>
            <span className={styles.badge}>Gói phổ biến</span>
            <h2>Harness Monthly</h2>
            <p className={styles.price}>$1 / tháng</p>
            <p className={styles.vnd}>{formatVnd(HARNESS_MONTHLY_PRICE_VND)} / tháng</p>
            <ul className={styles.featureList}>
              <li>Thinking process nâng cao</li>
              <li>Tool orchestration ưu tiên</li>
              <li>Adaptive rules cá nhân hóa</li>
              <li>Hỗ trợ liên tục trong BiliBily</li>
            </ul>
            <div className={styles.actions}>
              <Button type="button" variant="secondary" size="md" onClick={() => router.push('/ai-tutor')}>
                Quay lại BiliBily
              </Button>
              <Button type="button" variant="primary" size="md" onClick={handlePayment} disabled={paying}>
                {paying ? 'Đang tạo thanh toán...' : 'Thanh toán qua PayOS'}
              </Button>
            </div>
            <p className={styles.note}>Bạn sẽ được chuyển sang cổng thanh toán bảo mật của PayOS.</p>
          </article>

          <aside className={styles.infoCard}>
            <h3>Thông tin thanh toán</h3>
            <p>Phương thức hỗ trợ:</p>
            <ul className={styles.channelList}>
              <li>QR VietQR</li>
              <li>MoMo / ZaloPay</li>
              <li>ATM / Visa / MasterCard</li>
            </ul>
            <p className={styles.note}>Sau khi thanh toán thành công, hệ thống sẽ xác nhận ở màn hình kết quả.</p>
          </aside>
        </section>
      </main>
    </div>
  );
}
