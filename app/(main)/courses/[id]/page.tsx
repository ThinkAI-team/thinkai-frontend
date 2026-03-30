'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import PageState from '@/components/ui/PageState';
import { formatDateTimeVi, formatVnd } from '@/lib/utils/format';
import dashboardStyles from '../../dashboard/page.module.css';
import MainSidebar from '../../components/MainSidebar';
import styles from './page.module.css';
import {
  getCourseDetail,
  getMyCourses,
  type CourseDetailResponse,
} from '@/services/courses';
import {
  createCourseReview,
  getCourseReviews,
  type CourseReview,
} from '@/services/reviews';

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const courseId = Number(params.id);

  const [course, setCourse] = useState<CourseDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, reviewText: '' });
  const [reviewMessage, setReviewMessage] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadCourseData = useCallback(async () => {
    if (!Number.isFinite(courseId)) {
      setError('ID khóa học không hợp lệ.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadingReviews(true);
    setError('');
    try {
      const [data, reviewData, myCourses] = await Promise.all([
        getCourseDetail(courseId),
        getCourseReviews(courseId).catch(() => [] as CourseReview[]),
        getMyCourses().catch(() => []),
      ]);
      setCourse(data);
      setIsEnrolled(
        Boolean(data.isEnrolled) || myCourses.some((myCourse) => myCourse.id === data.id)
      );
      setReviews(reviewData);
    } catch (err: any) {
      setError(err.message || 'Không thể tải chi tiết khóa học.');
    } finally {
      setLoading(false);
      setLoadingReviews(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  const handleEnroll = () => {
    if (!course) return;
    router.push(`/payment?courseId=${course.id}`);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    const reviewText = reviewForm.reviewText.trim();
    if (!reviewText) {
      setReviewMessage('Vui lòng nhập nội dung nhận xét.');
      return;
    }

    setSubmittingReview(true);
    setReviewMessage('');
    try {
      const created = await createCourseReview(course.id, {
        rating: reviewForm.rating,
        reviewText,
      });
      setReviews((prev) => [created, ...prev]);
      setReviewForm({ rating: 5, reviewText: '' });
      setReviewMessage('Đã gửi đánh giá thành công.');
    } catch (err: any) {
      setReviewMessage(err.message || 'Không thể gửi đánh giá.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className={dashboardStyles.container}>
        <MainSidebar active="courses" />
        <main className={`${dashboardStyles.main} ${styles.main}`}>
          <PageState
            type="loading"
            title="Đang tải chi tiết khóa học"
            message="Hệ thống đang đồng bộ thông tin khóa học và danh sách bài học."
          />
        </main>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className={dashboardStyles.container}>
        <MainSidebar active="courses" />
        <main className={`${dashboardStyles.main} ${styles.main}`}>
          <PageState
            type="error"
            message={error || 'Không tìm thấy khóa học.'}
            actionLabel="Thử lại"
            onAction={loadCourseData}
          />
        </main>
      </div>
    );
  }

  const firstLessonId = course.lessons?.[0]?.id;
  const averageRating = reviews.length
    ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length
    : 0;

  return (
    <div className={dashboardStyles.container}>
      <MainSidebar active="courses" />
      <main className={`${dashboardStyles.main} ${styles.main}`}>
        <div className={styles.container}>
          <div className={styles.content}>
            <nav className={styles.breadcrumb}>
              <Link href="/">Trang chủ</Link>
              <span>›</span>
              <Link href="/courses">Khóa học</Link>
              <span>›</span>
              <span>Chi tiết</span>
            </nav>

            <header className={styles.header}>
              <h1>{course.title}</h1>
              <p className={styles.subtitle}>{course.description}</p>

              <div className={styles.meta}>
                <span>{course.lessons.length} bài học</span>
                <span>{course.instructorName || 'Đang cập nhật giảng viên'}</span>
                <span>Tiến độ: {Math.round(course.progressPercent || 0)}%</span>
              </div>
            </header>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Nội dung khóa học</h2>
                <p className={styles.curriculumMeta}>
                  {course.lessons.length} bài học
                </p>
              </div>

              <div className={styles.curriculum}>
                {course.lessons.map((lesson) => (
                  <div key={lesson.id} className={styles.curriculumSection}>
                    <div className={styles.sectionTitle}>
                      <span className={styles.expandIcon}>{lesson.isCompleted ? '✓' : '○'}</span>
                      <span>{lesson.title}</span>
                      <span className={styles.sectionMeta}>
                        {lesson.type}
                        {lesson.duration ? ` • ${lesson.duration}` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <h2>Giảng viên</h2>
              <div className={styles.instructor}>
                <div className={styles.instructorAvatar}>GV</div>
                <div className={styles.instructorInfo}>
                  <h3>{course.instructorName || 'Đang cập nhật'}</h3>
                  <p className={styles.instructorTitle}>ThinkAI Instructor</p>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2>Đánh giá khóa học</h2>
              <div className={styles.reviews}>
                <div className={styles.reviewSummary}>
                  <div className={styles.reviewScore}>
                    <span className={styles.scoreNumber}>{averageRating.toFixed(1)}</span>
                    <span className={styles.stars}>{averageRating.toFixed(1)} / 5</span>
                    <span className={styles.totalReviews}>{reviews.length} đánh giá</span>
                  </div>
                </div>

                <form className={styles.reviewForm} onSubmit={handleSubmitReview}>
                  <div className={styles.reviewInputs}>
                    <select
                      value={reviewForm.rating}
                      onChange={(e) =>
                        setReviewForm((prev) => ({ ...prev, rating: Number(e.target.value) }))
                      }
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value} sao
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={reviewForm.reviewText}
                      onChange={(e) =>
                        setReviewForm((prev) => ({ ...prev, reviewText: e.target.value }))
                      }
                      placeholder="Nhập nhận xét về khóa học..."
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      type="submit"
                      className={styles.reviewSubmitBtn}
                      disabled={submittingReview}
                    >
                      {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </Button>
                  </div>
                  {reviewMessage && <p className={styles.reviewMessage}>{reviewMessage}</p>}
                </form>

                {loadingReviews ? (
                  <PageState type="loading" message="Đang tải đánh giá khóa học..." />
                ) : (
                  <div className={styles.reviewList}>
                    {reviews.length === 0 ? (
                      <PageState type="empty" message="Chưa có đánh giá nào cho khóa học này." />
                    ) : (
                      reviews.slice(0, 6).map((review) => (
                        <article key={review.id} className={styles.reviewItem}>
                          <div className={styles.reviewItemHeader}>
                            <strong>{review.userName || 'Học viên ThinkAI'}</strong>
                            <span>{Math.max(1, Math.min(5, review.rating))} / 5</span>
                          </div>
                          <p>{review.reviewText}</p>
                          {review.createdAt && (
                            <small>{formatDateTimeVi(review.createdAt)}</small>
                          )}
                        </article>
                      ))
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.pricingCard}>
              <div className={styles.videoPreview}>
                <div className={styles.playButton}>▶</div>
                <span>Thông tin khóa học</span>
              </div>

              <div className={styles.priceRow}>
                <span className={styles.currentPrice}>
                  {typeof course.price === 'number'
                    ? formatVnd(course.price)
                    : 'Đang cập nhật'}
                </span>
                {isEnrolled && <span className={styles.discount}>Đã đăng ký</span>}
              </div>

              {!isEnrolled ? (
                <Button
                  variant="primary"
                  size="lg"
                  className={styles.enrollBtn}
                  onClick={handleEnroll}
                >
                  Đăng ký ngay
                </Button>
              ) : firstLessonId ? (
                <Link href={`/learn/${firstLessonId}`}>
                  <Button variant="primary" size="lg" className={styles.enrollBtn}>
                    Vào học ngay
                  </Button>
                </Link>
              ) : null}

              {message && <p className={styles.guarantee}>{message}</p>}

              <div className={styles.includes}>
                <h4>Khóa học bao gồm:</h4>
                <ul>
                  <li>{course.lessons.length} bài học</li>
                  <li>Giảng viên: {course.instructorName || 'Đang cập nhật'}</li>
                  <li>Theo dõi tiến độ học tập</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
