'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dashboardStyles from '../dashboard/page.module.css';
import MainSidebar from '../components/MainSidebar';
import styles from './page.module.css';
import Button from '@/components/ui/Button';
import { formatVnd } from '@/lib/utils/format';
import { getCourseDetail, createPaymentLink, type CourseDetailResponse, type PaymentResponse } from '@/services/courses';

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseIdParam = searchParams.get('courseId');

  const [course, setCourse] = useState<CourseDetailResponse | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (!courseIdParam) return;
    const courseId = Number(courseIdParam);
    if (!Number.isFinite(courseId)) return;

    setLoadingCourse(true);
    getCourseDetail(courseId)
      .then(setCourse)
      .catch(() => setCourse(null))
      .finally(() => setLoadingCourse(false));
  }, [courseIdParam]);

  const orderName = course?.title || 'Khóa học ThinkAI';
  const orderPrice = course && typeof course.price === 'number' ? course.price : 0;
  const orderDescription = course
    ? `Giảng viên: ${course.instructorName || 'ThinkAI'} • ${course.lessons.length} bài học`
    : 'Học với AI thông minh';

  const handlePayment = async () => {
    if (!course) return;
    
    setPaying(true);
    try {
      const payment = await createPaymentLink(course.id);
      
      if (payment.checkoutUrl) {
        window.location.href = payment.checkoutUrl;
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại.');
    } finally {
      setPaying(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className={`${dashboardStyles.container} ${styles.container}`}>
        <MainSidebar active="payment" />
        <main className={`${dashboardStyles.main} ${styles.main}`}>
          <div className={styles.successOverlay}>
            <div className={styles.successCard}>
              <div className={styles.successIcon}>✓</div>
              <h1 className={styles.successTitle}>Thanh toán thành công!</h1>
              <p className={styles.successMessage}>
                {course
                  ? `Bạn đã đăng ký thành công khóa học "${course.title}".`
                  : 'Giao dịch của bạn đã được xử lý thành công.'}
              </p>
              <p className={styles.successSub}>
                Số tiền: {formatVnd(orderPrice)}
              </p>
              <div className={styles.successActions}>
                {course ? (
                  <Button
                    variant="primary"
                    size="lg"
                    className={styles.successBtn}
                    onClick={() => router.push(`/courses/${course.id}`)}
                  >
                    Vào khóa học →
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    className={styles.successBtn}
                    onClick={() => router.push('/dashboard')}
                  >
                    Về trang chủ →
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push('/courses')}
                >
                  Xem thêm khóa học
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`${dashboardStyles.container} ${styles.container}`}>
      <MainSidebar active="payment" />
      <main className={`${dashboardStyles.main} ${styles.main}`}>
        <div className={styles.secureTag}>
          Thanh toán an toàn qua payOS
        </div>

        <div className={styles.content}>
          <div className={styles.paymentForm}>
            <h1>Thông tin thanh toán</h1>
            <p className={styles.subtitle}>
              Bạn sẽ được chuyển sang trang thanh toán an toàn của payOS để hoàn tất giao dịch.
            </p>

            <section className={styles.section}>
              <div className={styles.paymentInfo}>
                <div className={styles.paymentMethodBox}>
                  <div className={styles.methodIcon}>QR</div>
                  <div className={styles.methodInfo}>
                    <span className={styles.methodTitle}>Thanh toán qua payOS</span>
                    <span className={styles.methodSubtitle}>
                      Hỗ trợ QR VietQR, thẻ ATM, thẻ tín dụng và ví điện tử (MoMo, ZaloPay)
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <div className={styles.instructionBox}>
              <h3>Hướng dẫn thanh toán:</h3>
              <ol>
                <li>Nhấn nút "Thanh toán ngay" bên dưới</li>
                <li>Bạn sẽ được chuyển sang trang thanh toán payOS</li>
                <li>Chọn phương thức thanh toán phù hợp (QR VietQR, MoMo, ZaloPay, thẻ ATM/Visa)</li>
                <li>Hoàn tất thanh toán theo hướng dẫn</li>
                <li>Sau khi thanh toán thành công, bạn sẽ được tự động đăng ký khóa học</li>
              </ol>
            </div>
          </div>

          <aside className={styles.orderSummary}>
            <h2>Đơn hàng của bạn</h2>
            
            {loadingCourse ? (
              <div className={styles.qrPlaceholder}>
                <p>Đang tải thông tin khóa học...</p>
              </div>
            ) : (
              <>
                <div className={styles.orderItem}>
                  <div className={styles.orderIcon}>KH</div>
                  <div className={styles.orderInfo}>
                    <span className={styles.orderName}>{orderName}</span>
                    <span className={styles.orderCycle}>Thanh toán một lần</span>
                    <span className={styles.orderLink}>{orderDescription}</span>
                  </div>
                  <div className={styles.orderPrices}>
                    <span className={styles.orderPrice}>{formatVnd(orderPrice)}</span>
                  </div>
                </div>

                <div className={styles.summaryRows}>
                  <div className={styles.summaryRow}>
                    <span>Tạm tính</span>
                    <span>{formatVnd(orderPrice)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Giảm giá</span>
                    <span className={styles.discount}>-{formatVnd(0)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Thuế (VAT)</span>
                    <span>Đã bao gồm</span>
                  </div>
                </div>

                <div className={styles.totalRow}>
                  <span>Tổng cộng</span>
                  <div>
                    <span className={styles.totalPrice}>{formatVnd(orderPrice)}</span>
                    <span className={styles.totalCycle}>Truy cập vĩnh viễn</span>
                  </div>
                </div>
              </>
            )}

            <Button
              variant="primary"
              size="lg"
              className={styles.payBtn}
              onClick={handlePayment}
              disabled={paying || !course}
            >
              {paying ? 'Đang xử lý...' : 'Thanh toán ngay →'}
            </Button>

            <div className={styles.secureInfo}>
              <p>Bảo mật bởi payOS</p>
              <div className={styles.paymentLogos}>
                <span>VietQR</span>
                <span>MoMo</span>
                <span>ATM</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
