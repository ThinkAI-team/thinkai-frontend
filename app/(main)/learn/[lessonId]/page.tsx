'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PageState from '@/components/ui/PageState';
import Button from '@/components/ui/Button';
import styles from './page.module.css';
import {
  completeLesson,
  getLearningRoomLayout,
  getLessonDetail,
  updateVideoProgress,
  type LearningRoomLayout,
  type LessonDetail,
} from '@/services/learning';

const isYouTubeUrl = (url: string): boolean => {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
};

const getVideoId = (url: string): string | null => {
  if (!url) return null;
  if (url.includes('youtube.com/embed/')) {
    return url.split('youtube.com/embed/')[1]?.split('?')[0] || null;
  }
  if (url.includes('youtube.com/watch?v=')) {
    return url.split('v=')[1]?.split('&')[0] || null;
  }
  if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1]?.split('?')[0] || null;
  }
  return null;
};

let ytApiReady = false;
let ytApiCallbacks: Array<() => void> = [];

const loadYouTubeAPI = () => {
  if (typeof window === 'undefined') return;
  if (ytApiReady) return;
  if (document.getElementById('youtube-api')) {
    ytApiCallbacks.push(() => { });
    return;
  }
  const tag = document.createElement('script');
  tag.id = 'youtube-api';
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  (window as any).onYouTubeIframeAPIReady = () => {
    ytApiReady = true;
    ytApiCallbacks.forEach((cb) => cb());
    ytApiCallbacks = [];
  };
};

export default function LearningRoomPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = Number(params.lessonId);

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [layout, setLayout] = useState<LearningRoomLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [courseProgress, setCourseProgress] = useState(0);
  const playerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoIdRef = useRef<string | null>(null);
  const hasAutoCompleted = useRef(false);
  const lessonRef = useRef(lesson);
  lessonRef.current = lesson;

  const handleComplete = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    const isAuto = e?.currentTarget?.dataset?.auto === 'true';
    const currentLesson = lessonRef.current;
    if (!currentLesson || currentLesson.isCompleted) return;
    if (isAuto && hasAutoCompleted.current) return;
    try {
      const result = await completeLesson(currentLesson.id, {
        watchTimeSeconds: currentLesson.watchTimeSeconds || currentLesson.durationSeconds || 0,
      });
      setMessage(isAuto ? `Đã xem xong video. Bài học hoàn thành! Tiến độ: ${result.courseProgress}%` : `Đã đánh dấu hoàn thành. Tiến độ khóa học: ${result.courseProgress}%`);
      setLesson((prev) => (prev ? { ...prev, isCompleted: true } : prev));
      if (isAuto) hasAutoCompleted.current = true;
    } catch (err: any) {
      setMessage(err.message || 'Không thể cập nhật tiến độ.');
    }
  };

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
      setCourseProgress(layoutData.progressPercent || 0);
    } catch (err: any) {
      setError(err.message || 'Không thể tải bài học.');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    loadLessonData();
  }, [loadLessonData]);

  useEffect(() => {
    if (lesson?.type !== 'VIDEO') return;
    if (!isYouTubeUrl(lesson.contentUrl || '')) return;
    const videoId = getVideoId(lesson.contentUrl || '');
    if (!videoId) return;
    hasAutoCompleted.current = false;
    videoIdRef.current = null;
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch (_) { }
      playerRef.current = null;
    }
    loadYouTubeAPI();
    let cancelled = false;
    const playerId = `youtube-player-${lesson.id}`;
    const initPlayer = () => {
      if (cancelled) return;
      const el = document.getElementById(playerId);
      if (!el) {
        requestAnimationFrame(initPlayer);
        return;
      }
      playerRef.current = new (window as any).YT.Player(playerId, {
        videoId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          origin: window.location.origin,
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
        },
        events: {
          onStateChange: (event: any) => {
            if (event.data === (window as any).YT.PlayerState.ENDED) {
              const btn = document.querySelector('[data-auto="true"]') as HTMLButtonElement;
              if (btn) btn.click();
            }
          },
        },
      });
      videoIdRef.current = videoId;
    };
    if (ytApiReady) {
      requestAnimationFrame(initPlayer);
    } else {
      ytApiCallbacks.push(initPlayer);
    }
    return () => {
      cancelled = true;
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (_) { }
        playerRef.current = null;
      }
    };
  }, [lesson?.id, lesson?.type, lesson?.contentUrl]);

  // === Progress Tracking: gọi API mỗi 10s ===
  useEffect(() => {
    if (!lesson || lesson.type !== 'VIDEO') return;
    const interval = setInterval(() => {
      let watchTime = 0;
      let currentTime = 0;

      if (isYouTubeUrl(lesson.contentUrl || '')) {
        // YouTube player
        if (playerRef.current?.getCurrentTime && playerRef.current?.getPlayerState) {
          const state = playerRef.current.getPlayerState();
          if (state === 1) { // PLAYING
            currentTime = Math.floor(playerRef.current.getCurrentTime());
            watchTime = currentTime;
          } else return; // không gửi nếu đang pause
        } else return;
      } else {
        // HTML5 video
        const video = videoRef.current;
        if (video && !video.paused) {
          currentTime = Math.floor(video.currentTime);
          watchTime = currentTime;
        } else return;
      }

      updateVideoProgress(lesson.id, { watchTimeSeconds: watchTime, currentTimeSeconds: currentTime })
        .then((res) => {
          setCourseProgress(res.courseProgressPercent);
          if (res.isCompleted && !lessonRef.current?.isCompleted) {
            setLesson((prev) => prev ? { ...prev, isCompleted: true } : prev);
            setMessage(`Đã xem xong video. Bài học hoàn thành! Tiến độ: ${res.courseProgressPercent}%`);
          }
        })
        .catch(() => {}); // silent fail
    }, 10000);

    return () => clearInterval(interval);
  }, [lesson?.id, lesson?.type, lesson?.contentUrl]);

  // === Resume playback: set video position từ currentTimeSeconds ===
  useEffect(() => {
    if (!lesson || lesson.type !== 'VIDEO') return;
    const resumeTime = lesson.currentTimeSeconds || 0;
    if (resumeTime <= 0) return;

    if (!isYouTubeUrl(lesson.contentUrl || '')) {
      // HTML5 video resume
      const video = videoRef.current;
      if (video) {
        const handleLoaded = () => { video.currentTime = resumeTime; };
        video.addEventListener('loadedmetadata', handleLoaded, { once: true });
        return () => video.removeEventListener('loadedmetadata', handleLoaded);
      }
    }
    // YouTube resume handled in YT.Player onReady
  }, [lesson?.id, lesson?.currentTimeSeconds]);

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

  const progress = courseProgress;

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
              isYouTubeUrl(lesson.contentUrl || '') ? (
                <div key={lesson.id} id={`youtube-player-${lesson.id}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
              ) : (
                <video
                  key={lesson.id}
                  ref={videoRef}
                  src={lesson.contentUrl || undefined}
                  controls
                  controlsList="nodownload"
                  style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
                  onEnded={() => {
                    const btn = document.querySelector('[data-auto="true"]') as HTMLButtonElement;
                    if (btn) btn.click();
                  }}
                />
              )
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
                  data-auto="true"
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
