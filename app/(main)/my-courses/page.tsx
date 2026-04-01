'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dashboardStyles from '../dashboard/page.module.css';
import MainSidebar from '../components/MainSidebar';
import styles from './page.module.css';
import PageState from '@/components/ui/PageState';
import { formatVnd } from '@/lib/utils/format';
import { getMyCourses, type MyCourseItem } from '@/services/courses';

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<MyCourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyCourses();
      setCourses(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách khóa học.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  return (
    <div className={dashboardStyles.container}>
      <MainSidebar active="my-courses" />
      <main className={`${dashboardStyles.main} ${styles.main}`}>
        <section className={styles.hero}>
          <h1>Khóa học của tôi</h1>
          <p>Danh sách các khóa học bạn đã đăng ký trên ThinkAI.</p>
        </section>

        <section className={styles.content}>
          {loading && (
            <PageState type="loading" message="Đang tải danh sách khóa học của bạn..." />
          )}

          {!loading && error && (
            <PageState
              type="error"
              message={error}
              actionLabel="Thử lại"
              onAction={loadCourses}
            />
          )}

          {!loading && !error && courses.length === 0 && (
            <PageState
              type="empty"
              message="Bạn chưa đăng ký khóa học nào."
              actionLabel="Khám phá khóa học"
              onAction={() => window.location.href = '/courses'}
            />
          )}

          {!loading && !error && courses.length > 0 && (
            <>
              <div className={styles.statsRow}>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>{courses.length}</span>
                  <span className={styles.statLabel}>Khóa học đã đăng ký</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>
                    {courses.filter((c) => c.progressPercent >= 100).length}
                  </span>
                  <span className={styles.statLabel}>Đã hoàn thành</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>
                    {courses.filter((c) => c.progressPercent > 0 && c.progressPercent < 100).length}
                  </span>
                  <span className={styles.statLabel}>Đang học</span>
                </div>
              </div>

              <div className={styles.courseGrid}>
                {courses.map((course) => (
                  <Link href={`/my-courses/${course.id}`} key={course.id} className={styles.courseCard}>
                    <div className={styles.courseImage}>
                      <span className={styles.progressTag}>
                        {Math.round(course.progressPercent)}%
                      </span>
                    </div>
                    <div className={styles.courseInfo}>
                      <h3>{course.title}</h3>
                      <div className={styles.progressBarWrapper}>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{ width: `${Math.min(100, Math.round(course.progressPercent))}%` }}
                          />
                        </div>
                        <span className={styles.progressText}>
                          {Math.round(course.progressPercent)}% hoàn thành
                        </span>
                      </div>
                      <div className={styles.courseFooter}>
                        <span className={styles.price}>{formatVnd(course.price)}</span>
                        {course.nextLesson ? (
                          <span className={styles.nextLesson}>
                            Tiếp: {course.nextLesson.title}
                          </span>
                        ) : (
                          <span className={styles.nextLesson}>
                            {course.progressPercent >= 100 ? '✓ Hoàn thành' : 'Bắt đầu học'}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
