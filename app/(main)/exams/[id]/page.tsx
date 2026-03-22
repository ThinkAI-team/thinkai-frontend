'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import dashboardStyles from '../../dashboard/page.module.css';
import MainSidebar from '../../components/MainSidebar';
import styles from './page.module.css';
import Button from '@/components/ui/Button';
import PageState from '@/components/ui/PageState';
import { startExam, submitExam, type StartExamResponse } from '@/services/exams';

const DEFAULT_DURATION_SECONDS = 120 * 60;

export default function ExamTakingPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const examId = Number(params.id);

  const [session, setSession] = useState<StartExamResponse | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION_SECONDS);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadExamSession = useCallback(async () => {
    if (!Number.isFinite(examId)) {
      setError('Mã bài thi không hợp lệ.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const started = await startExam(examId);
      setSession(started);
      setTimeLeft((started.timeLimitMinutes || 120) * 60);
    } catch (err: any) {
      setError(err.message || 'Không thể bắt đầu bài thi.');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    loadExamSession();
  }, [loadExamSession]);

  useEffect(() => {
    if (loading || submitting) return undefined;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, submitting]);

  const questions = session?.questions || [];
  const totalQuestions = questions.length;
  const question = questions[currentQuestion];
  const progress = totalQuestions > 0 ? ((currentQuestion + 1) / totalQuestions) * 100 : 0;

  const answerCount = useMemo(
    () => Object.keys(answers).length,
    [answers]
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (option: string) => {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: option }));
  };

  const handleSubmit = async () => {
    if (!session) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        attemptId: session.attemptId,
        answers: Object.entries(answers).map(([questionId, selectedOption]) => ({
          questionId: Number(questionId),
          selectedOption,
        })),
      };
      const result = await submitExam(examId, payload);
      router.push(`/exams/${examId}/result?attemptId=${result.attemptId}`);
    } catch (err: any) {
      setError(err.message || 'Nộp bài thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={dashboardStyles.container}>
        <MainSidebar active="exams" />
        <main className={`${dashboardStyles.main} ${styles.examArea}`}>
          <PageState
            type="loading"
            title="Đang tải bài thi"
            message="Hệ thống đang khởi tạo phiên làm bài cho bạn."
          />
        </main>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className={dashboardStyles.container}>
        <MainSidebar active="exams" />
        <main className={`${dashboardStyles.main} ${styles.examArea}`}>
          <PageState
            type="error"
            message={error}
            actionLabel="Thử lại"
            onAction={loadExamSession}
          />
        </main>
      </div>
    );
  }

  if (!question) {
    return (
      <div className={dashboardStyles.container}>
        <MainSidebar active="exams" />
        <main className={`${dashboardStyles.main} ${styles.examArea}`}>
          <PageState
            type="empty"
            message="Bài thi chưa có câu hỏi."
            actionLabel="Quay lại danh sách bài thi"
            onAction={() => router.push('/exams')}
          />
        </main>
      </div>
    );
  }

  return (
    <div className={dashboardStyles.container}>
      <MainSidebar active="exams" />

      <div className={styles.examArea}>
        <header className={styles.header}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoText}>ThinkAI</span>
          </Link>

          <div className={styles.timer}>
            <span className={styles.timerText}>{formatTime(timeLeft)}</span>
          </div>

          <div className={styles.headerActions}>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              className={styles.exitBtn}
              onClick={() => router.push('/exams')}
            >
              Thoát bài thi
            </Button>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.categoryTag}>EXAM #{examId}</div>

          <div className={styles.questionNumber}>
            Câu {currentQuestion + 1} <span>/{totalQuestions}</span>
          </div>

          <h1 className={styles.questionText}>{question.content}</h1>
          <p className={styles.instruction}>Chọn một đáp án chính xác nhất bên dưới.</p>

          {error && <p className={`${styles.instruction} ${styles.errorText}`}>{error}</p>}

          <div
            className={styles.optionsGrid}
            role="radiogroup"
            aria-label={`Danh sách đáp án cho câu ${currentQuestion + 1}`}
          >
            {question.options.map((option) => (
              <Button
                key={option}
                variant="secondary"
                size="sm"
                type="button"
                role="radio"
                aria-checked={answers[question.id] === option}
                className={`${styles.optionBtn} ${answers[question.id] === option ? styles.selected : ''}`}
                onClick={() => handleSelectAnswer(option)}
              >
                <span className={styles.optionText}>{option}</span>
                {answers[question.id] === option && <span className={styles.checkIcon}>✓</span>}
              </Button>
            ))}
          </div>
        </main>

        <footer className={styles.footer}>
          <div className={styles.progressSection}>
            <span className={styles.progressLabel}>TIẾN ĐỘ</span>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <span className={styles.progressPercent}>
              {answerCount}/{totalQuestions} đã chọn
            </span>
          </div>

          <div className={styles.navigation}>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              className={styles.prevBtn}
              onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
            >
              ← Câu trước
            </Button>

            <div className={styles.questionDots} role="navigation" aria-label="Danh sách câu hỏi">
              {Array.from({ length: totalQuestions }, (_, i) => {
                const q = questions[i];
                return (
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    key={q.id}
                    aria-label={`Chuyển tới câu ${i + 1}`}
                    aria-current={i === currentQuestion ? 'true' : undefined}
                    aria-pressed={i === currentQuestion}
                    className={`${styles.dot} ${i === currentQuestion ? styles.currentDot : ''} ${answers[q.id] ? styles.answeredDot : ''}`}
                    onClick={() => setCurrentQuestion(i)}
                  >
                    {''}
                  </Button>
                );
              })}
            </div>

            {currentQuestion < totalQuestions - 1 ? (
              <Button variant="primary" onClick={() => setCurrentQuestion((prev) => prev + 1)}>
                Câu sau →
              </Button>
            ) : (
              <Button variant="warm" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Đang nộp...' : 'Nộp bài →'}
              </Button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
