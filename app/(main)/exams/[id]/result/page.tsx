'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import styles from './page.module.css';
import Button from '@/components/ui/Button';
import { getExamResult, type ExamResultResponse } from '@/services/exams';

export default function ExamResultPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const examId = params.id;
  const resultId = Number(searchParams.get('resultId'));

  const [result, setResult] = useState<ExamResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      if (!Number.isFinite(resultId)) {
        setError('Thiếu resultId để xem kết quả.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const data = await getExamResult(resultId);
        setResult(data);
      } catch (err: any) {
        setError(err.message || 'Không thể tải kết quả bài thi.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [resultId]);

  const totalQuestions = result?.details.length || 0;
  const correctAnswers = useMemo(
    () => result?.details.filter((item) => item.isCorrect).length || 0,
    [result]
  );
  const incorrectAnswers = Math.max(0, totalQuestions - correctAnswers);
  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (percentage / 100) * circumference;

  if (loading) {
    return <div className={styles.main}>Đang tải kết quả...</div>;
  }

  if (error || !result) {
    return <div className={styles.main}>{error || 'Không có dữ liệu kết quả.'}</div>;
  }

  return (
    <>
      <Navbar />

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.resultCard}>
            <div className={styles.resultHeader}>
              <div className={styles.leftContent}>
                <span className={styles.badge}>🎯 Kết quả bài thi</span>
                <h1>Hoàn thành bài thi</h1>
                <p>
                  Kết quả đã được chấm. Bạn có thể xem chi tiết từng câu bên dưới.
                </p>
                <div className={styles.actions}>
                  <Link href={`/exams/${examId}`}>
                    <Button variant="primary">🔄 Làm lại bài thi</Button>
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
                    stroke="#E5E7EB"
                    strokeWidth="12"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    fill="none"
                    stroke="#3B82F6"
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
                <span className={styles.statIcon}>✅</span>
                <div>
                  <p className={styles.statLabel}>Câu trả lời đúng</p>
                  <p className={styles.statValue}>{correctAnswers}</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <span className={`${styles.statIcon} ${styles.incorrect}`}>❌</span>
                <div>
                  <p className={styles.statLabel}>Câu trả lời sai</p>
                  <p className={styles.statValue}>{incorrectAnswers}</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <span className={`${styles.statIcon} ${styles.time}`}>📊</span>
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
              {result.details.map((q, idx) => (
                <div
                  key={q.questionId}
                  className={`${styles.questionItem} ${q.isCorrect ? styles.correct : styles.wrong}`}
                >
                  <span className={styles.questionIcon}>
                    {q.isCorrect ? '✓' : '✕'}
                  </span>
                  <div className={styles.questionContent}>
                    <p className={styles.questionNumber}>Câu hỏi {idx + 1}</p>
                    <div className={`${styles.answerBox} ${q.isCorrect ? styles.correctBg : styles.wrongBg}`}>
                      {q.isCorrect ? (
                        <p>Đáp án của bạn: {q.userAnswer}</p>
                      ) : (
                        <>
                          <p className={styles.wrongAnswer}>Bạn chọn: {q.userAnswer}</p>
                          <p className={styles.correctAnswer}>Đáp án đúng: {q.correctAnswer}</p>
                        </>
                      )}
                      {q.explanation && <p>Giải thích: {q.explanation}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
