'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PageState from '@/components/ui/PageState';
import Button from '@/components/ui/Button';
import styles from './page.module.css';
import {
  completeLesson,
  getLearningRoomLayout,
  getLessonDetail,
  type LearningRoomLayout,
  type LessonDetail,
} from '@/services/learning';

export default function LearningRoomPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = Number(params.lessonId);

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [layout, setLayout] = useState<LearningRoomLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadLessonData = useCallback(async () => {
    if (!Number.isFinite(lessonId)) {
      setError('Bài học không hợp lệ.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const lessonData = await getLessonDetail(lessonId);
      setLesson(lessonData);
      const layoutData = await getLearningRoomLayout(lessonData.courseId);
      setLayout(layoutData);
    } catch (err: any) {
      setError(err.message || 'Không thể tải bài học.');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    loadLessonData();
  }, [loadLessonData]);

  const handleComplete = async () => {
    if (!lesson) return;
    try {
      const result = await completeLesson(lesson.id, {
        watchTimeSeconds: lesson.watchTimeSeconds || lesson.durationSeconds || 0,
      });
      setMessage(`Đã đánh dấu hoàn thành. Tiến độ khóa học: ${result.courseProgress}%`);
      setLesson((prev) => (prev ? { ...prev, isCompleted: true } : prev));
    } catch (err: any) {
      setMessage(err.message || 'Không thể cập nhật tiến độ.');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <PageState
          type="loading"
          title="Đang tải bài học"
          message="Hệ thống đang chuẩn bị nội dung học và tiến độ của bạn."
        />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className={styles.container}>
        <PageState
          type="error"
          message={error || 'Không tìm thấy bài học.'}
          actionLabel="Thử lại"
          onAction={loadLessonData}
        />
      </div>
    );
  }

  const progress = layout?.progressPercent || 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>ThinkAI</span>
        </Link>

        <nav className={styles.nav}>
          <Link href="/courses" className={styles.navActive}>Khóa học</Link>
          <Link href="/exams">Bài thi</Link>
          <Link href="/ai-tutor">Gia sư AI</Link>
        </nav>

        <div className={styles.headerRight}>
          <div className={styles.progressBadge}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${Math.round(progress)}%` }} />
            </div>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className={styles.user}>
            <span>Bài học</span>
            <div className={styles.avatar}>L</div>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <nav className={styles.breadcrumb}>
            <span>
              <Link href="/courses">{lesson.courseTitle || 'Khóa học'}</Link> › Bài học chi tiết
            </span>
          </nav>

          <div className={styles.videoPlayer}>
            {lesson.type === 'VIDEO' ? (
              <iframe
                src={lesson.contentUrl || ''}
                title={lesson.title}
                width="100%"
                height="100%"
                className={styles.videoFrame}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : lesson.type === 'PDF' ? (
              <div className={styles.pdfViewer}>
                <p>PDF Viewer</p>
                {lesson.contentUrl && (
                  <a href={lesson.contentUrl} target="_blank" rel="noreferrer">
                    Mở tài liệu PDF
                  </a>
                )}
              </div>
            ) : (
              <div className={styles.textViewer}>
                <p>{lesson.contentText || 'Nội dung văn bản đang được cập nhật.'}</p>
              </div>
            )}
          </div>

          <div className={styles.lessonInfo}>
            <div className={styles.lessonHeader}>
              <h1>{lesson.title}</h1>
              <div className={styles.lessonActions}>
                <Button
                  variant={lesson.isCompleted ? 'secondary' : 'primary'}
                  size="sm"
                  type="button"
                  className={styles.actionBtn}
                  onClick={handleComplete}
                >
                  {lesson.isCompleted ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                </Button>
              </div>
            </div>
            <p className={styles.lessonDesc}>
              Loại bài học: {lesson.type}
              {lesson.durationSeconds ? ` • ${Math.round(lesson.durationSeconds / 60)} phút` : ''}
            </p>
            {message && <p className={styles.note}>{message}</p>}
          </div>

          <section className={styles.resources}>
            <h3>Tài nguyên bài học</h3>
            <div className={styles.resourceGrid}>
              {lesson.contentUrl ? (
                <a href={lesson.contentUrl} className={styles.resourceCard} target="_blank" rel="noreferrer">
                  <span className={styles.resourceIcon}>Link</span>
                  <div>
                    <span className={styles.resourceTitle}>Nội dung bài học</span>
                    <span className={styles.resourceSubtitle}>Mở tài liệu nguồn</span>
                  </div>
                </a>
              ) : (
                <div className={styles.resourceCard}>
                  <span className={styles.resourceIcon}>Info</span>
                  <div>
                    <span className={styles.resourceTitle}>Không có liên kết đính kèm</span>
                    <span className={styles.resourceSubtitle}>Nội dung dạng văn bản</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className={styles.sidebar}>
          <h2>Nội dung khóa học</h2>
          <p className={styles.partTitle}>{layout?.title || lesson.courseTitle || 'Learning Room'}</p>

          <div className={styles.lessonList}>
            {(layout?.lessons || []).map((item) => (
              <Link
                key={item.id}
                href={`/learn/${item.id}`}
                className={`${styles.lessonItem} ${item.id === lesson.id ? styles.currentLesson : ''}`}
              >
                <span className={styles.lessonIcon}>
                  {item.isCompleted ? 'DONE' : item.id === lesson.id ? 'NOW' : 'NEXT'}
                </span>
                <div className={styles.lessonDetails}>
                  <span className={styles.lessonName}>{item.title}</span>
                  <span className={styles.lessonDuration}>{item.type}</span>
                </div>
              </Link>
            ))}
          </div>

          <Link href="/ai-tutor" className={styles.aiTutorBtn}>
            <span className={styles.aiIcon}>AI</span>
            <div>
              <span className={styles.aiLabel}>Hỏi Gia sư AI</span>
              <span className={styles.aiStatus}>ONLINE</span>
            </div>
          </Link>
        </aside>
      </main>
    </div>
  );
}
