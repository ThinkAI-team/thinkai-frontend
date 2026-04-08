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
  getLessonTutorSummary,
  getLessonDetail,
  markPdfOpened,
  updateVideoProgress,
  type LessonTutorSummaryResponse,
  type LearningRoomLayout,
  type LessonDetail,
} from '@/services/learning';
import { summarizeLesson } from '@/services/ai-tutor';
import { ApiException } from '@/services/api';

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
  const VIDEO_COMPLETE_THRESHOLD = 90;
  const params = useParams<{ lessonId: string }>();
  const lessonId = Number(params.lessonId);

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [layout, setLayout] = useState<LearningRoomLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState<LessonTutorSummaryResponse | null>(null);
  const [flashcardLoading, setFlashcardLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<Array<{ front: string; back: string }>>([]);
  const [bulletLoading, setBulletLoading] = useState(false);
  const [bulletPoints, setBulletPoints] = useState<string[]>([]);
  const [courseProgress, setCourseProgress] = useState(0);
  const playerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoIdRef = useRef<string | null>(null);
  const hasAutoCompleted = useRef(false);
  const hasPdfMarked = useRef(false);
  const lessonRef = useRef(lesson);
  lessonRef.current = lesson;

  const handleComplete = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    const isAuto = e?.currentTarget?.dataset?.auto === 'true';
    const currentLesson = lessonRef.current;
    if (!currentLesson || currentLesson.isCompleted) return;
    const percentFromApi = currentLesson.lessonProgressPercent || 0;
    const watchTime = currentLesson.watchTimeSeconds || 0;
    const duration = currentLesson.durationSeconds || 0;
    const percentFromWatch = duration > 0 ? Math.min(100, (watchTime / duration) * 100) : 0;
    const effectivePercent = Math.max(percentFromApi, percentFromWatch);
    if (currentLesson.type === 'VIDEO' && effectivePercent < VIDEO_COMPLETE_THRESHOLD) {
      setMessage('Bạn cần xem ít nhất 90% video trước khi đánh dấu hoàn thành.');
      return;
    }
    if (isAuto && hasAutoCompleted.current) return;
    try {
      const result = await completeLesson(currentLesson.id, {
        watchTimeSeconds: currentLesson.watchTimeSeconds || currentLesson.durationSeconds || 0,
      });
      setCourseProgress(result.courseProgress);
      setMessage(isAuto ? `Đã xem xong video. Bài học hoàn thành! Tiến độ: ${result.courseProgress}%` : `Đã đánh dấu hoàn thành. Tiến độ khóa học: ${result.courseProgress}%`);
      setLesson((prev) => (prev ? { ...prev, isCompleted: true } : prev));
      if (isAuto) hasAutoCompleted.current = true;
    } catch (err: any) {
      setMessage(err.message || 'Không thể cập nhật tiến độ.');
    }
  };

  const openBiliBilyFloating = (prompt?: string) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('thinkai:bilibily-open', {
        detail: prompt ? { prompt } : {},
      })
    );
  };

  const handleTutorSummary = async () => {
    if (!lesson || summaryLoading) return;

    setSummaryLoading(true);
    setMessage('');
    try {
      try {
        const result = await getLessonTutorSummary(lesson.id);
        setSummaryResult(result);
      } catch (err) {
        if (err instanceof ApiException && err.status === 404) {
          const fallback = await summarizeLesson({
            content: buildLessonSummarySource(lesson),
          });
          setSummaryResult({
            lessonId: lesson.id,
            summary: fallback.summary,
            keyPoints: [],
            transcriptUsed: false,
            sourceType: 'frontend_fallback',
          });
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      setMessage(err?.message || 'Không thể tạo tóm tắt từ BiliBily.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleTutorFlashcard = async () => {
    if (!lesson || flashcardLoading) return;
    setFlashcardLoading(true);
    setMessage('');
    try {
      const prompt = [
        'You are an English tutor. Create concise study flashcards from lesson content.',
        'Return ONLY valid JSON, no markdown, no extra text.',
        'Format: {"flashcards":[{"front":"...","back":"..."}]}',
        'Rules:',
        '- Output exactly 6 flashcards.',
        '- front: short question or trigger phrase.',
        '- back: concise explanation in Vietnamese.',
        '- Focus on core grammar/vocab patterns that are easy to revise.',
        '',
        'Lesson content:',
        buildLessonSummarySource(lesson),
      ].join('\n');

      const res = await summarizeLesson({ content: prompt });
      const parsed = parseFlashcards(res.summary);
      setFlashcards(parsed);
      if (!parsed.length) {
        setMessage('Không đọc được flashcard từ phản hồi AI. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setMessage(err?.message || 'Không thể tạo flashcard.');
    } finally {
      setFlashcardLoading(false);
    }
  };

  const handleBulletPoints = async () => {
    if (!lesson || bulletLoading) return;
    setBulletLoading(true);
    setMessage('');
    try {
      const prompt = [
        'You are an English tutor. Extract the 3 most important learning points.',
        'Return ONLY valid JSON, no markdown, no extra text.',
        'Format: {"bulletPoints":["...","...","..."]}',
        'Rules:',
        '- Exactly 3 bullet points.',
        '- Each point max 18 words.',
        '- Use Vietnamese, practical and easy to remember.',
        '',
        'Lesson content:',
        buildLessonSummarySource(lesson),
      ].join('\n');

      const res = await summarizeLesson({ content: prompt });
      const parsed = parseBulletPoints(res.summary);
      setBulletPoints(parsed);
      if (!parsed.length) {
        setMessage('Không đọc được bullet points từ phản hồi AI. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setMessage(err?.message || 'Không thể tạo bullet points.');
    } finally {
      setBulletLoading(false);
    }
  };

  const buildLessonSummarySource = (item: LessonDetail) => {
    const content = (item.contentText || '').trim();
    if (content) {
      return `Lesson title: ${item.title}\nLesson type: ${item.type}\n\n${content}`.slice(0, 12000);
    }
    return `Lesson title: ${item.title}\nLesson type: ${item.type}\nLesson url: ${item.contentUrl || 'N/A'}\nProvide useful study output based on available lesson signals.`;
  };

  const parseFlashcards = (raw: string): Array<{ front: string; back: string }> => {
    try {
      const json = extractJson(raw);
      const data = JSON.parse(json) as { flashcards?: Array<{ front?: string; back?: string }> };
      return (data.flashcards || [])
        .map((c) => ({
          front: (c.front || '').trim(),
          back: (c.back || '').trim(),
        }))
        .filter((c) => c.front && c.back);
    } catch {
      return [];
    }
  };

  const parseBulletPoints = (raw: string): string[] => {
    try {
      const json = extractJson(raw);
      const data = JSON.parse(json) as { bulletPoints?: string[] };
      return (data.bulletPoints || []).map((x) => x.trim()).filter(Boolean).slice(0, 3);
    } catch {
      const lines = raw
        .split('\n')
        .map((x) => x.replace(/^[-*\d.)\s]+/, '').trim())
        .filter(Boolean);
      return lines.slice(0, 3);
    }
  };

  const extractJson = (raw: string): string => {
    const text = raw.trim();
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) return fenced[1].trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) return text.slice(start, end + 1);
    return text;
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
          onReady: (event: any) => {
            const resumeTime = lessonRef.current?.currentTimeSeconds || 0;
            if (resumeTime > 0) {
              event.target.seekTo(resumeTime, true);
            }
          },
          onStateChange: (event: any) => {
            if (event.data === (window as any).YT.PlayerState.ENDED) {
              const duration = lessonRef.current?.durationSeconds || 0;
              if (duration > 0) {
                setLesson((prev) => prev ? {
                  ...prev,
                  watchTimeSeconds: duration,
                  currentTimeSeconds: duration,
                  lessonProgressPercent: 100,
                } : prev);
              }
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
          setLesson((prev) => prev ? {
            ...prev,
            watchTimeSeconds: res.watchTimeSeconds,
            currentTimeSeconds: res.currentTimeSeconds,
            lessonProgressPercent: res.lessonProgressPercent,
            isCompleted: res.isCompleted || prev.isCompleted,
          } : prev);
          if (res.isCompleted && !lessonRef.current?.isCompleted) {
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

  // === PDF Auto-Complete: đánh dấu hoàn thành khi mở bài PDF ===
  useEffect(() => {
    if (!lesson || lesson.type !== 'PDF') return;
    if (lesson.isCompleted) return;
    if (hasPdfMarked.current) return;
    hasPdfMarked.current = true;

    markPdfOpened(lesson.id)
      .then((res) => {
        if (res.isCompleted) {
          setLesson((prev) => prev ? { ...prev, isCompleted: true } : prev);
          setCourseProgress(res.courseProgressPercent);
          setMessage('Đã mở tài liệu PDF. Bài học hoàn thành!');
        }
      })
      .catch(() => {}); // silent fail
  }, [lesson?.id, lesson?.type, lesson?.isCompleted]);

  // === Video Fallback: gửi progress lần cuối khi đóng tab ===
  useEffect(() => {
    if (!lesson || lesson.type !== 'VIDEO') return;

    const handleBeforeUnload = () => {
      let currentTime = 0;
      if (isYouTubeUrl(lesson.contentUrl || '')) {
        if (playerRef.current?.getCurrentTime) {
          currentTime = Math.floor(playerRef.current.getCurrentTime());
        }
      } else if (videoRef.current) {
        currentTime = Math.floor(videoRef.current.currentTime);
      }
      if (currentTime > 0) {
        const payload = JSON.stringify({ watchTimeSeconds: currentTime, currentTimeSeconds: currentTime });
        navigator.sendBeacon(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/courses/lessons/${lesson.id}/progress`,
          new Blob([payload], { type: 'application/json' })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [lesson?.id, lesson?.type, lesson?.contentUrl]);

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
  const videoPercent = lesson.lessonProgressPercent || 0;
  const canMarkComplete = lesson.isCompleted
    || lesson.type !== 'VIDEO'
    || videoPercent >= VIDEO_COMPLETE_THRESHOLD;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>ThinkAI</span>
        </Link>

        <nav className={styles.nav}>
          <Link href="/courses" className={styles.navActive}>Khóa học</Link>
          <Link href="/exams">Bài thi</Link>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => openBiliBilyFloating(`Mình đang học bài "${lesson?.title || ''}". Giúp mình nhé.`)}
          >
            BiliBily
          </button>
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
                    const duration = lessonRef.current?.durationSeconds || 0;
                    if (duration > 0) {
                      setLesson((prev) => prev ? {
                        ...prev,
                        watchTimeSeconds: duration,
                        currentTimeSeconds: duration,
                        lessonProgressPercent: 100,
                      } : prev);
                    }
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
                  disabled={!canMarkComplete}
                >
                  {lesson.isCompleted ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  className={styles.actionBtn}
                  onClick={handleTutorSummary}
                  disabled={summaryLoading}
                >
                  {summaryLoading ? 'Đang tóm tắt...' : 'Tutor Summary'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  className={styles.actionBtn}
                  onClick={handleTutorFlashcard}
                  disabled={flashcardLoading}
                >
                  {flashcardLoading ? 'Đang tạo...' : 'Tutor Flashcard'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  className={styles.actionBtn}
                  onClick={handleBulletPoints}
                  disabled={bulletLoading}
                >
                  {bulletLoading ? 'Đang tạo...' : 'Bullet Points'}
                </Button>
              </div>
            </div>
            <p className={styles.lessonDesc}>
              Loại bài học: {lesson.type}
              {lesson.durationSeconds ? ` • ${Math.round(lesson.durationSeconds / 60)} phút` : ''}
            </p>
            {lesson.type === 'VIDEO' && !lesson.isCompleted && (
              <p className={styles.note}>
                Tiến độ video: {Math.round(videoPercent)}% (cần tối thiểu 90% để hoàn thành)
              </p>
            )}
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
            {summaryResult && (
              <div className={styles.summaryBox}>
                <p className={styles.summaryTitle}>Tóm tắt từ BiliBily</p>
                <p className={styles.summaryText}>{summaryResult.summary}</p>
                {Array.isArray(summaryResult.keyPoints) && summaryResult.keyPoints.length > 0 && (
                  <ul className={styles.summaryList}>
                    {summaryResult.keyPoints.map((point, index) => (
                      <li key={`${index}-${point}`}>{point}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {flashcards.length > 0 && (
              <div className={styles.summaryBox}>
                <p className={styles.summaryTitle}>Tutor Flashcards</p>
                <div className={styles.flashcardList}>
                  {flashcards.map((card, index) => (
                    <div key={`${index}-${card.front}`} className={styles.flashcardItem}>
                      <p><strong>Q:</strong> {card.front}</p>
                      <p><strong>A:</strong> {card.back}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {bulletPoints.length > 0 && (
              <div className={styles.summaryBox}>
                <p className={styles.summaryTitle}>3 Điểm Chính Bài Học</p>
                <ul className={styles.summaryList}>
                  {bulletPoints.map((point, index) => (
                    <li key={`${index}-${point}`}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
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

          <button
            type="button"
            className={styles.aiTutorBtn}
            onClick={() => openBiliBilyFloating(`Mình đang học bài "${lesson.title}". Hãy hỗ trợ mình tiếp nhé.`)}
          >
            <span className={styles.aiIcon}>AI</span>
            <div>
              <span className={styles.aiLabel}>Hỏi BiliBily</span>
              <span className={styles.aiStatus}>ONLINE</span>
            </div>
          </button>
        </aside>
      </main>
    </div>
  );
}
