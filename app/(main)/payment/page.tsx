'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import Button from '@/components/ui/Button';

const paymentMethods = [
  { id: 'card', icon: '💳', title: 'Thẻ tín dụng / Ghi nợ', subtitle: 'Visa, Mastercard, JCB' },
  { id: 'qr', icon: '📱', title: 'Chuyển khoản ngân hàng (QR)', subtitle: 'Quét mã VietQR nhanh chóng' },
  { id: 'wallet', icon: '📲', title: 'Ví điện tử (Momo / ZaloPay)', subtitle: 'Liên kết qua ứng dụng ví' },
];

const orderData = {
  name: 'Gói Học tập Thông minh (Pro)',
  cycle: '1 năm',
  originalPrice: 1800000,
  price: 1200000,
  discount: 600000,
};

export default function PaymentPage() {
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [coupon, setCoupon] = useState('');

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>✨</span>
          <span className={styles.logoText}>ThinkAI</span>
        </Link>
        
        <div className={styles.secureTag}>
          <span>🔒</span> Thanh toán an toàn
        </div>
      </header>

      <main className={styles.main}>
        {/* Left - Payment Form */}
        <div className={styles.paymentForm}>
          <h1>Thông tin thanh toán</h1>
          <p className={styles.subtitle}>Vui lòng chọn phương thức thanh toán và nhập thông tin bên dưới.</p>

          {/* Payment Methods */}
          <section className={styles.section}>
            <h2>💳 Phương thức thanh toán</h2>
            
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
                      <span>💳</span>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </section>

          {/* Card Details */}
          {selectedMethod === 'card' && (
            <section className={styles.section}>
              <h2>💳 Chi tiết thẻ</h2>
              
              <div className={styles.formGroup}>
                <label>Tên chủ thẻ</label>
                <input type="text" placeholder="NGUYEN VAN A" className={styles.input} />
              </div>
              
              <div className={styles.formGroup}>
                <label>Số thẻ</label>
                <div className={styles.cardInput}>
                  <span>💳</span>
                  <input type="text" placeholder="0000 0000 0000 0000" className={styles.input} />
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Ngày hết hạn</label>
                  <input type="text" placeholder="MM/YY" className={styles.input} />
                </div>
                <div className={styles.formGroup}>
                  <label>CVV ℹ️</label>
                  <div className={styles.cvvInput}>
                    <span>🔒</span>
                    <input type="password" placeholder="•••" className={styles.input} />
                  </div>
                </div>
              </div>
            </section>
          )}

          {selectedMethod === 'qr' && (
            <section className={styles.section}>
              <div className={styles.qrPlaceholder}>
                <span>📱</span>
                <p>Mã QR sẽ hiển thị sau khi nhấn "Thanh toán ngay"</p>
              </div>
            </section>
          )}

          {selectedMethod === 'wallet' && (
            <section className={styles.section}>
              <div className={styles.walletOptions}>
                <button className={styles.walletBtn}>Momo</button>
                <button className={styles.walletBtn}>ZaloPay</button>
              </div>
            </section>
          )}
        </div>

        {/* Right - Order Summary */}
        <aside className={styles.orderSummary}>
          <h2>Đơn hàng của bạn</h2>
          
          <div className={styles.orderItem}>
            <div className={styles.orderIcon}>🎓</div>
            <div className={styles.orderInfo}>
              <span className={styles.orderName}>{orderData.name}</span>
              <span className={styles.orderCycle}>Chu kỳ: {orderData.cycle}</span>
              <Link href="#" className={styles.orderLink}>Mở khóa tất cả tính năng AI</Link>
            </div>
            <div className={styles.orderPrices}>
              <span className={styles.orderPrice}>{orderData.price.toLocaleString()}đ</span>
              <span className={styles.orderOriginal}>{orderData.originalPrice.toLocaleString()}đ</span>
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
            <button className={styles.couponBtn}>Áp dụng</button>
          </div>

          {/* Summary */}
          <div className={styles.summaryRows}>
            <div className={styles.summaryRow}>
              <span>Tạm tính</span>
              <span>{orderData.price.toLocaleString()}đ</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Giảm giá</span>
              <span className={styles.discount}>-{orderData.discount.toLocaleString()}đ</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Thuế (VAT)</span>
              <span>Đã bao gồm</span>
            </div>
          </div>

          <div className={styles.totalRow}>
            <span>Tổng cộng</span>
            <div>
              <span className={styles.totalPrice}>{orderData.price.toLocaleString()}đ</span>
              <span className={styles.totalCycle}>Thanh toán định kỳ hàng năm</span>
            </div>
          </div>

          <Button variant="primary" size="lg" className={styles.payBtn}>
            Thanh toán ngay →
          </Button>

          <div className={styles.secureInfo}>
            <p>🔒 Bảo mật SSL 256-bit</p>
            <div className={styles.paymentLogos}>
              <span>VISA</span>
              <span>MC</span>
              <span>MoMo</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
