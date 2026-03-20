'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import styles from './page.module.css';
import {
  getCourses,
  type CourseListItem,
  type CourseListResponse,
} from '@/services/courses';

const sortOptions = [
  { label: 'Mới nhất', sortBy: 'createdAt', sortDir: 'desc' as const },
  { label: 'Giá thấp nhất', sortBy: 'price', sortDir: 'asc' as const },
  { label: 'Giá cao nhất', sortBy: 'price', sortDir: 'desc' as const },
];

export default function CoursesPage() {
  const [keywordInput, setKeywordInput] = useState('');
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [pageData, setPageData] = useState<CourseListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState({
    page: 0,
    size: 9,
    keyword: '',
    sortBy: 'createdAt',
    sortDir: 'desc' as 'asc' | 'desc',
  });

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getCourses(query);
        setPageData(data);
        setCourses(data.content);
      } catch (err: any) {
        setError(err.message || 'Không thể tải danh sách khóa học.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [query]);

  const handleSearch = () => {
    setQuery((prev) => ({
      ...prev,
      page: 0,
      keyword: keywordInput.trim(),
    }));
  };

  const handleSortChange = (value: string) => {
    const next = sortOptions[Number(value)] || sortOptions[0];
    setQuery((prev) => ({
      ...prev,
      page: 0,
      sortBy: next.sortBy,
      sortDir: next.sortDir,
    }));
  };

  return (
    <>
      <Navbar />

      <main className={styles.main}>
        <section className={styles.hero}>
          <h1>
            Khám phá tri thức
            <br />
            <em>vượt giới hạn</em>
          </h1>
          <p>Danh sách khóa học được đồng bộ trực tiếp từ hệ thống ThinkAI.</p>

          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm khóa học..."
              className={styles.searchInput}
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className={styles.clearBtn} onClick={handleSearch}>Tìm</button>
          </div>
        </section>

        <section className={styles.content}>
          <aside className={styles.sidebar}>
            <div className={styles.filterHeader}>
              <h3>Trạng thái</h3>
              <button
                className={styles.clearBtn}
                onClick={() => {
                  setKeywordInput('');
                  setQuery({
                    page: 0,
                    size: 9,
                    keyword: '',
                    sortBy: 'createdAt',
                    sortDir: 'desc',
                  });
                }}
              >
                Đặt lại
              </button>
            </div>
            <div className={styles.filterGroup}>
              <h4>THÔNG TIN</h4>
              <label className={styles.checkbox}>
                <input type="checkbox" checked readOnly />
                <span>Đang hiển thị API thật</span>
              </label>
              <label className={styles.checkbox}>
                <input type="checkbox" checked={loading} readOnly />
                <span>{loading ? 'Đang tải dữ liệu' : 'Tải dữ liệu thành công'}</span>
              </label>
            </div>
          </aside>

          <div className={styles.courseSection}>
            <div className={styles.courseHeader}>
              <p>
                Hiển thị <strong>{courses.length}</strong> trên{' '}
                <strong>{pageData?.totalElements || 0}</strong> khóa học
              </p>
              <div className={styles.sortBy}>
                <span>Sắp xếp theo:</span>
                <select onChange={(e) => handleSortChange(e.target.value)}>
                  {sortOptions.map((option, idx) => (
                    <option value={idx} key={option.label}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading && <p>Đang tải danh sách khóa học...</p>}
            {error && <p>{error}</p>}

            {!loading && !error && (
              <div className={styles.courseGrid}>
                {courses.map((course) => (
                  <Link href={`/courses/${course.id}`} key={course.id} className={styles.courseCard}>
                    <div className={styles.courseImage}>
                      <span className={styles.categoryTag}>KHÓA HỌC</span>
                    </div>
                    <div className={styles.courseInfo}>
                      <div className={styles.ratingRow}>
                        <span className={styles.star}>👥</span>
                        <span className={styles.rating}>{course.enrolledCount}</span>
                        <span className={styles.reviews}>học viên</span>
                      </div>
                      <h3>{course.title}</h3>
                      <p>{course.lessonsCount} bài học</p>
                      <div className={styles.courseFooter}>
                        <div className={styles.instructor}>
                          <span className={styles.avatar}>👤</span>
                          <span>{course.instructor?.fullName || 'Đang cập nhật'}</span>
                        </div>
                        <span className={styles.price}>{course.price.toLocaleString()}đ</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={(pageData?.page || 0) <= 0}
                onClick={() =>
                  setQuery((prev) => ({
                    ...prev,
                    page: Math.max(0, prev.page - 1),
                  }))
                }
              >
                ‹
              </button>
              <button className={`${styles.pageBtn} ${styles.active}`}>
                {(pageData?.page || 0) + 1}
              </button>
              <button
                className={styles.pageBtn}
                disabled={(pageData?.page || 0) + 1 >= (pageData?.totalPages || 1)}
                onClick={() =>
                  setQuery((prev) => ({
                    ...prev,
                    page: prev.page + 1,
                  }))
                }
              >
                ›
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
