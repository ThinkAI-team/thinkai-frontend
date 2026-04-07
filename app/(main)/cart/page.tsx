'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dashboardStyles from '../dashboard/page.module.css';
import styles from '../courses/page.module.css';
import MainSidebar from '../components/MainSidebar';
import PageState from '@/components/ui/PageState';
import Button from '@/components/ui/Button';
import { formatVnd } from '@/lib/utils/format';
import { getCart, removeFromCart, clearCart, createPaymentLink, type CartItem } from '@/services/courses';

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<number | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const loadCart = async () => {
    try {
      const cart = await getCart();
      setItems(cart.items || []);
      setSelectedItems(new Set((cart.items || []).map((item: CartItem) => item.courseId)));
    } catch (err) {
      console.error('Error loading cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleToggleItem = (courseId: number) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map((item) => item.courseId)));
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map((item) => item.courseId)));
    }
  };

  const handleRemove = async (courseId: number) => {
    if (!confirm('Bạn có chắc muốn xóa khóa học này khỏi giỏ?')) return;
    setRemoving(courseId);
    try {
      const cart = await removeFromCart(courseId);
      setItems(cart.items || []);
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(courseId);
        return newSet;
      });
    } catch (err) {
      console.error('Error removing item:', err);
    } finally {
      setRemoving(null);
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) return;
    try {
      await clearCart();
      setItems([]);
      setSelectedItems(new Set());
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  const handleCheckout = async () => {
    if (selectedItems.size === 0) {
      alert('Vui lòng chọn ít nhất 1 khóa học để thanh toán');
      return;
    }

    setCheckingOut(true);
    try {
      const selectedCourseIds = Array.from(selectedItems);
      const firstCourseId = selectedCourseIds[0];
      
      const payment = await createPaymentLink(firstCourseId);
      
      if (payment.checkoutUrl) {
        window.location.href = payment.checkoutUrl;
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      alert(err.message || 'Có lỗi xảy ra khi thanh toán');
    } finally {
      setCheckingOut(false);
    }
  };

  const selectedTotal = items
    .filter((item) => selectedItems.has(item.courseId))
    .reduce((sum, item) => sum + item.price, 0);

  if (loading) {
    return (
      <div className={dashboardStyles.container}>
        <MainSidebar active="cart" />
        <main className={`${dashboardStyles.main} ${styles.main}`}>
          <PageState type="loading" message="Đang tải giỏ hàng..." />
        </main>
      </div>
    );
  }

  return (
    <div className={dashboardStyles.container}>
      <MainSidebar active="cart" />
      <main className={`${dashboardStyles.main} ${styles.main}`}>
        <section className={styles.hero}>
          <h1>
            Giỏ hàng
            <br />
            <em>của bạn</em>
          </h1>
          <p>Danh sách khóa học bạn đã thêm vào giỏ.</p>
        </section>

        <section className={styles.content}>
          {items.length === 0 ? (
            <PageState
              type="empty"
              message="Giỏ hàng trống"
              actionLabel="Khám phá khóa học"
              onAction={() => router.push('/courses')}
            />
          ) : (
            <>
              <div className={styles.courseSection}>
                <div className={styles.courseHeader}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={toggleSelectAll}
                    style={{ marginRight: '12px' }}
                  >
                    {selectedItems.size === items.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </Button>
                  <span style={{ fontWeight: 600 }}>
                    {selectedItems.size} / {items.length} khóa học được chọn
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleClearCart}
                    style={{ marginLeft: 'auto' }}
                  >
                    Xóa tất cả
                  </Button>
                </div>

                <div className={styles.courseGrid}>
                  {items.map((item) => (
                    <div 
                      key={item.courseId} 
                      className={styles.courseCard} 
                      onClick={() => handleToggleItem(item.courseId)}
                      style={{ 
                        position: 'relative',
                        cursor: 'pointer',
                        border: selectedItems.has(item.courseId) ? '2px solid #ef4444' : '1px solid var(--line-soft)'
                      }}
                    >
                      <div 
                        className={styles.courseImage} 
                        style={item.thumbnailUrl ? { 
                          backgroundImage: `url(${item.thumbnailUrl})`, 
                          backgroundSize: 'cover', 
                          backgroundPosition: 'center' 
                        } : {}}
                      >
                        <span className={styles.categoryTag}>GIỎ HÀNG</span>
                        {selectedItems.has(item.courseId) && (
                          <span style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: '#ef4444',
                            color: 'white',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px'
                          }}>✓</span>
                        )}
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemove(item.courseId);
                          }}
                          disabled={removing === item.courseId}
                          title="Xóa khỏi giỏ"
                        >
                          {removing === item.courseId ? '...' : '×'}
                        </button>
                      </div>
                      <div className={styles.courseInfo}>
                        <h3>{item.courseTitle}</h3>
                        <p>Giảng viên: {item.instructorName}</p>
                        <div className={styles.courseFooter}>
                          <div className={styles.instructor}>
                            <span>{formatVnd(item.price)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className={styles.sidebar}>
                <div className={styles.pricingCard}>
                  <h3>Tổng giỏ hàng</h3>
                  <div style={{ margin: '16px 0', padding: '16px', background: 'var(--surface)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>Số khóa học:</span>
                      <strong>{selectedItems.size} / {items.length}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700 }}>
                      <span>Tổng tiền:</span>
                      <span style={{ color: '#10b981' }}>{formatVnd(selectedTotal)}</span>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    className={styles.enrollBtn}
                    onClick={handleCheckout}
                    disabled={checkingOut || selectedItems.size === 0}
                  >
                    {checkingOut ? 'Đang xử lý...' : `Thanh toán (${selectedItems.size} khóa học)`}
                  </Button>
                </div>
              </aside>
            </>
          )}
        </section>
      </main>
    </div>
  );
}