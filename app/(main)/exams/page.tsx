'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import styles from './page.module.css';
import { getMyCourses, type MyCourseItem } from '@/services/courses';
import {
  getCourseExams,
  getExamHistory,
  type ExamHistoryItem,
  type ExamSummary,
} from '@/services/exams';

export default function ExamsPage() {
  const [courses, setCourses] = useState<MyCourseItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [history, setHistory] = useState<ExamHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError('');
      try {
        const [myCourses, examHistory] = await Promise.all([
          getMyCourses(),
          getExamHistory().catch(() => []),
        ]);
        setCourses(myCourses);
        setHistory(examHistory);

        if (myCourses.length > 0) {
          const firstCourseId = myCourses[0].id;
          setSelectedCourseId(firstCourseId);
          const examList = await getCourseExams(firstCourseId);
          setExams(examList);
        }
      } catch (err: any) {
        setError(err.message || 'Không thể tải danh sách bài thi.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleCourseChange = async (courseId: number) => {
    setSelectedCourseId(courseId);
    setLoading(true);
    setError('');
    try {
      const examList = await getCourseExams(courseId);
      setExams(examList);
    } catch (err: any) {
      setError(err.message || 'Không thể tải bài thi của khóa học này.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <section className={styles.header}>
          <h1>Danh sách bài thi</h1>
          <p>Chọn khóa học đã đăng ký để làm bài thi theo lộ trình.</p>
        </section>

        {error && <p className={styles.error}>{error}</p>}

        {courses.length > 0 ? (
          <section className={styles.courseSelector}>
            <label htmlFor="course">Khóa học</label>
            <select
              id="course"
              value={selectedCourseId || ''}
              onChange={(e) => handleCourseChange(Number(e.target.value))}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </section>
        ) : (
          !loading && (
            <section className={styles.empty}>
              <p>Bạn chưa có khóa học đã đăng ký. Hãy đăng ký khóa học trước khi làm bài thi.</p>
              <Link href="/courses" className={styles.linkBtn}>Đi tới danh sách khóa học</Link>
            </section>
          )
        )}

        <section className={styles.grid}>
          <div className={styles.card}>
            <h2>Bài thi khả dụng</h2>
            {loading ? (
              <p>Đang tải...</p>
            ) : exams.length === 0 ? (
              <p>Chưa có bài thi cho khóa học này.</p>
            ) : (
              <ul className={styles.list}>
                {exams.map((exam) => (
                  <li key={exam.id} className={styles.item}>
                    <div>
                      <h3>{exam.title}</h3>
                      <p>{exam.description || 'Bài thi luyện tập'}</p>
                      <small>
                        {exam.totalQuestions} câu • {exam.durationMinutes} phút
                      </small>
                    </div>
                    <Link href={`/exams/${exam.id}`} className={styles.linkBtn}>
                      Bắt đầu
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.card}>
            <h2>Lịch sử làm bài</h2>
            {history.length === 0 ? (
              <p>Chưa có lịch sử làm bài.</p>
            ) : (
              <ul className={styles.list}>
                {history.slice(0, 8).map((item) => (
                  <li key={item.resultId} className={styles.historyItem}>
                    <div>
                      <h3>{item.examTitle}</h3>
                      <small>{new Date(item.completedAt).toLocaleString('vi-VN')}</small>
                    </div>
                    <span className={styles.score}>{item.score}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
