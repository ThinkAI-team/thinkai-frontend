'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import dashboardStyles from '../../../dashboard/page.module.css';
import MainSidebar from '../../../components/MainSidebar';
import styles from './page.module.css';
import Button from '@/components/ui/Button';
import PageState from '@/components/ui/PageState';
import { getExamResult, type ExamResultResponse } from '@/services/exams';

export default function ExamResultPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const examId = params.id;
  const attemptId = Number(searchParams.get('attemptId'));

  const [result, setResult] = useState<ExamResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadResult = useCallback(async () => {
    if (!Number.isFinite(attemptId)) {
      setError('Thiếu attemptId để xem kết quả.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await getExamResult(attemptId);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải kết quả bài thi.');
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    loadResult();
  }, [loadResult]);

  const totalQuestions = result?.answers.length || 0;
  const correctAnswers = useMemo(
    () => result?.answers.filter((item) => item.isCorrect).length || 0,
    [result]
  );
  const incorrectAnswers = Math.max(0, totalQuestions - correctAnswers);
  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (percentage / 100) * circumference;

  const getOptionFullText = (label: string, options: string[]) => {
    if (!label) return '';
    if (!options || options.length === 0) return label;
    
    // Tìm option bắt đầu bằng label (ví dụ "A. " hoặc chỉ "A")
    const found = options.find(opt => {
      const trimmed = opt.trim();
      return trimmed.startsWith(`${label}.`) || 
             trimmed.startsWith(`${label}:`) ||
             trimmed === label ||
             trimmed.startsWith(label + ' ');
    });
    
    return found || label;
  };

  if (loading) {
    return (
      <div className={dashboardStyles.container}>
        <MainSidebar active="exams" />
        <main className={`${dashboardStyles.main} ${styles.main}`}>
          <PageState
            type="loading"
            title="Đang tải kết quả bài thi"
            message="Hệ thống đang lấy điểm số và phân tích câu trả lời."
          />
        </main>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className={dashboardStyles.container}>
        <MainSidebar active="exams" />
        <main className={`${dashboardStyles.main} ${styles.main}`}>
          <PageState
            type="error"
            message={error || 'Không có dữ liệu kết quả.'}
            actionLabel="Thử lại"
            onAction={loadResult}
          />
        </main>
      </div>
    );
  }

  return (
    <div className={dashboardStyles.container}>
      <MainSidebar active="exams" />
      <main className={`${dashboardStyles.main} ${styles.main}`}>
        <div className={styles.container}>
          <div className={styles.resultCard}>
            <div className={styles.resultHeader}>
              <div className={styles.leftContent}>
                <span className={styles.badge}>Kết quả bài thi</span>
                <h1>Hoàn thành bài thi</h1>
                <p>
                  Kết quả đã được chấm. Bạn có thể xem chi tiết từng câu bên dưới.
                </p>
                <div className={styles.actions}>
                  <Link href={`/exams/${examId}`}>
                    <Button variant="primary">Làm lại bài thi</Button>
                  </Link>
                  <Link href="/exams">
                    <Button variant="secondary">Danh sách bài thi</Button>
                  </Link>
                </div>
              </div>

              <div className={styles.scoreCircle}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    fill="none"
                    stroke="var(--line-soft)"
                    strokeWidth="12"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 80 80)"
                  />
                </svg>
                <div className={styles.scoreText}>
                  <span className={styles.scoreNumber}>{result.score}</span>
                  <span className={styles.scorePercent}>{percentage}% đúng</span>
                </div>
              </div>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statIcon}>Đúng</span>
                <div>
                  <p className={styles.statLabel}>Câu trả lời đúng</p>
                  <p className={styles.statValue}>{correctAnswers}</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <span className={`${styles.statIcon} ${styles.incorrect}`}>Sai</span>
                <div>
                  <p className={styles.statLabel}>Câu trả lời sai</p>
                  <p className={styles.statValue}>{incorrectAnswers}</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <span className={`${styles.statIcon} ${styles.time}`}>Tổng</span>
                <div>
                  <p className={styles.statLabel}>Tổng câu hỏi</p>
                  <p className={styles.statValue}>{totalQuestions}</p>
                </div>
              </div>
            </div>

            {result.aiFeedback && (
              <div className={styles.answerBox}>
                <p>
                  <strong>AI Feedback:</strong> {result.aiFeedback}
                </p>
              </div>
            )}
          </div>

          <section className={styles.reviewSection}>
            <div className={styles.reviewHeader}>
              <h2>Chi tiết câu trả lời</h2>
              <div className={styles.legend}>
                <span className={styles.legendCorrect}>● Đúng</span>
                <span className={styles.legendIncorrect}>● Sai</span>
              </div>
            </div>

            <div className={styles.questionList}>
              {result.answers.map((q, idx) => (
                <div
                  key={q.questionId}
                  className={`${styles.questionItem} ${q.isCorrect ? styles.correct : styles.wrong}`}
                >
                  <span className={styles.questionIcon}>
                    {q.isCorrect ? '✓' : '✕'}
                  </span>
                  <div className={styles.questionContent}>
                    <p className={styles.questionNumber}>Câu hỏi {idx + 1}</p>
                    <p className={styles.questionText}>{q.content}</p>
                    <div className={`${styles.answerBox} ${q.isCorrect ? styles.correctBg : styles.wrongBg}`}>
                      {q.isCorrect ? (
                        <p>Đáp án của bạn: {getOptionFullText(q.selectedOption, q.options)}</p>
                      ) : (
                        <>
                          <p className={styles.wrongAnswer}>Bạn chọn: {q.selectedOption ? getOptionFullText(q.selectedOption, q.options) : 'Chưa trả lời'}</p>
                          <p className={styles.correctAnswer}>Đáp án đúng: {getOptionFullText(q.correctOption, q.options)}</p>
                        </>
                      )}
                      {q.explanation && <p className={styles.explanation}>Giải thích: {q.explanation}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
