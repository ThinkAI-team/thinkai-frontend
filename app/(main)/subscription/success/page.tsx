'use client';

import Link from 'next/link';
import dashboardStyles from '../../dashboard/page.module.css';
import MainSidebar from '../../components/MainSidebar';
import styles from '../page.module.css';
import Button from '@/components/ui/Button';

export default function SubscriptionSuccessPage() {
  return (
    <div className={`${dashboardStyles.container} ${styles.container}`}>
      <MainSidebar active="payment" />
      <main className={`${dashboardStyles.main} ${styles.main}`}>
        <section className={styles.hero}>
          <h1>Thanh toán thành công</h1>
          <p>Giao dịch Harness đã hoàn tất. Cảm ơn bạn đã nâng cấp.</p>
        </section>
        <div className={styles.planCard}>
          <p className={styles.price}>Harness Monthly đã được kích hoạt.</p>
          <div className={styles.actions}>
            <Link href="/ai-tutor">
              <Button type="button" variant="primary">Về BiliBily</Button>
            </Link>
            <Link href="/subscription">
              <Button type="button" variant="secondary">Xem lại gói</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
