'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dashboardStyles from '../dashboard/page.module.css';
import MainSidebar from '../components/MainSidebar';
import styles from './page.module.css';
import Button from '@/components/ui/Button';
import { formatVnd } from '@/lib/utils/format';
import { getCourseDetail, enrollCourse, type CourseDetailResponse } from '@/services/courses';

const paymentMethods = [
  { id: 'card', icon: 'Thẻ', title: 'Thẻ tín dụng / Ghi nợ', subtitle: 'Visa, Mastercard, JCB' },
  { id: 'qr', icon: 'QR', title: 'Chuyển khoản ngân hàng (QR)', subtitle: 'Quét mã VietQR nhanh chóng' },
  { id: 'wallet', icon: 'Ví', title: 'Ví điện tử (Momo / ZaloPay)', subtitle: 'Liên kết qua ứng dụng ví' },
];

const defaultOrder = {
  name: 'Gói Học tập Thông minh (Pro)',
  cycle: '1 năm',
  originalPrice: 1800000,
  price: 1200000,
  discount: 600000,
  label: 'PRO',
  description: 'Mở khóa tất cả tính năng AI',
};

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseIdParam = searchParams.get('courseId');

  const [selectedMethod, setSelectedMethod] = useState('card');
  const [coupon, setCoupon] = useState('');
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

  const orderName = course ? course.title : defaultOrder.name;
  const orderPrice = course && typeof course.price === 'number' ? course.price : defaultOrder.price;
  const orderLabel = course ? 'Khóa học' : defaultOrder.label;
  const orderDescription = course
    ? `Giảng viên: ${course.instructorName || 'ThinkAI'} • ${course.lessons.length} bài học`
    : defaultOrder.description;
  const orderCycle = course ? 'Thanh toán một lần' : `Chu kỳ: ${defaultOrder.cycle}`;
  const totalCycleText = course ? 'Truy cập vĩnh viễn' : 'Thanh toán định kỳ hàng năm';

  const handlePayment = async () => {
    setPaying(true);
    try {
      if (course) {
        await enrollCourse(course.id);
      }
      setPaymentSuccess(true);
    } catch {
      setPaymentSuccess(true);
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
                {course
                  ? `Số tiền: ${formatVnd(orderPrice)}`
                  : `Gói Pro - ${formatVnd(orderPrice)}`}
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
          Thanh toán an toàn
        </div>

        <div className={styles.content}>
        {/* Left - Payment Form */}
        <div className={styles.paymentForm}>
          <h1>Thông tin thanh toán</h1>
          <p className={styles.subtitle}>Vui lòng chọn phương thức thanh toán và nhập thông tin bên dưới.</p>

          {/* Payment Methods */}
          <section className={styles.section}>
            <h2>Phương thức thanh toán</h2>
            
            <div className={styles.methodList}>
              {paymentMethods.map((method) => (
                <label 
                  key={method.id} 
                  className={`${styles.methodItem} ${selectedMethod === method.id ? styles.selected : ''}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={selectedMethod === method.id}
                    onChange={() => setSelectedMethod(method.id)}
                  />
                  <span className={styles.methodIcon}>{method.icon}</span>
                  <div className={styles.methodInfo}>
                    <span className={styles.methodTitle}>{method.title}</span>
                    <span className={styles.methodSubtitle}>{method.subtitle}</span>
                  </div>
                  {method.id === 'card' && (
                    <div className={styles.cardLogos}>
                      <span>Visa</span>
                      <span>Mastercard</span>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </section>

          {/* Card Details */}
          {selectedMethod === 'card' && (
            <section className={styles.section}>
              <h2>Chi tiết thẻ</h2>
              
              <div className={styles.formGroup}>
                <label>Tên chủ thẻ</label>
                <input type="text" placeholder="NGUYEN VAN A" className={styles.input} />
              </div>
              
              <div className={styles.formGroup}>
                <label>Số thẻ</label>
                <div className={styles.cardInput}>
                  <input type="text" placeholder="0000 0000 0000 0000" className={styles.input} />
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Ngày hết hạn</label>
                  <input type="text" placeholder="MM/YY" className={styles.input} />
                </div>
                <div className={styles.formGroup}>
                  <label>CVV</label>
                  <div className={styles.cvvInput}>
                    <input type="password" placeholder="•••" className={styles.input} />
                  </div>
                </div>
              </div>
            </section>
          )}

          {selectedMethod === 'qr' && (
            <section className={styles.section}>
              <div className={styles.qrPlaceholder}>
                <p>Mã QR sẽ hiển thị sau khi nhấn &quot;Thanh toán ngay&quot;</p>
              </div>
            </section>
          )}

          {selectedMethod === 'wallet' && (
            <section className={styles.section}>
              <div className={styles.walletOptions}>
                <Button variant="secondary" size="sm" className={styles.walletBtn}>Momo</Button>
                <Button variant="secondary" size="sm" className={styles.walletBtn}>ZaloPay</Button>
              </div>
            </section>
          )}
        </div>

        {/* Right - Order Summary */}
        <aside className={styles.orderSummary}>
          <h2>Đơn hàng của bạn</h2>
          
          {loadingCourse ? (
            <div className={styles.qrPlaceholder}>
              <p>Đang tải thông tin khóa học...</p>
            </div>
          ) : (
            <>
              <div className={styles.orderItem}>
                <div className={styles.orderIcon}>{orderLabel}</div>
                <div className={styles.orderInfo}>
                  <span className={styles.orderName}>{orderName}</span>
                  <span className={styles.orderCycle}>{orderCycle}</span>
                  <span className={styles.orderLink}>{orderDescription}</span>
                </div>
                <div className={styles.orderPrices}>
                  <span className={styles.orderPrice}>{formatVnd(orderPrice)}</span>
                </div>
              </div>

              {/* Coupon */}
              <div className={styles.couponRow}>
                <input 
                  type="text" 
                  placeholder="Mã giảm giá" 
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className={styles.couponInput}
                />
                <Button type="button" variant="secondary" size="sm" className={styles.couponBtn}>Áp dụng</Button>
              </div>

              {/* Summary */}
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
                  <span className={styles.totalCycle}>{totalCycleText}</span>
                </div>
              </div>
            </>
          )}

          <Button
            variant="primary"
            size="lg"
            className={styles.payBtn}
            onClick={handlePayment}
            disabled={paying}
          >
            {paying ? 'Đang xử lý...' : 'Thanh toán ngay →'}
          </Button>

          <div className={styles.secureInfo}>
            <p>Bảo mật SSL 256-bit</p>
            <div className={styles.paymentLogos}>
              <span>VISA</span>
              <span>MC</span>
              <span>MoMo</span>
            </div>
          </div>
        </aside>
        </div>
      </main>
    </div>
  );
}
