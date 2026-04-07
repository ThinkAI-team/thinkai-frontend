'use client';

import Link from 'next/link';
import dashboardStyles from '../../dashboard/page.module.css';
import MainSidebar from '../../components/MainSidebar';
import styles from '../page.module.css';
import Button from '@/components/ui/Button';

export default function SubscriptionCancelPage() {
  return (
    <div className={`${dashboardStyles.container} ${styles.container}`}>
      <MainSidebar active="payment" />
      <main className={`${dashboardStyles.main} ${styles.main}`}>
        <section className={styles.hero}>
          <h1>Thanh toán chưa hoàn tất</h1>
          <p>Bạn đã hủy hoặc chưa hoàn thành giao dịch Harness.</p>
        </section>
        <div className={styles.planCard}>
          <p className={styles.note}>Bạn có thể thử lại bất cứ lúc nào.</p>
          <div className={styles.actions}>
            <Link href="/subscription">
              <Button type="button" variant="primary">Thanh toán lại</Button>
            </Link>
            <Link href="/ai-tutor">
              <Button type="button" variant="secondary">Về BiliBily</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
