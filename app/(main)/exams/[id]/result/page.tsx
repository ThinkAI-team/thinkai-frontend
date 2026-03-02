import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import styles from './page.module.css';
import Button from '@/components/ui/Button';

// Mock result data
const resultData = {
  examTitle: 'Kiến thức cơ bản về AI',
  score: 8,
  total: 10,
  percentage: 80,
  correctAnswers: 8,
  incorrectAnswers: 2,
  timeSpent: '12m 30s',
  questions: [
    {
      id: 1,
      text: 'AI là viết tắt của cụm từ nào?',
      userAnswer: 'Artificial Intelligence',
      correctAnswer: 'Artificial Intelligence',
      isCorrect: true
    },
    {
      id: 2,
      text: 'Mạng nơ-ron nhân tạo lấy cảm hứng từ đâu?',
      userAnswer: 'Hệ thống máy tính lượng tử',
      correctAnswer: 'Bộ não sinh học của con người',
      isCorrect: false
    },
    {
      id: 3,
      text: 'Ngôn ngữ lập trình nào phổ biến nhất cho AI hiện nay?',
      userAnswer: 'Python',
      correctAnswer: 'Python',
      isCorrect: true
    },
    {
      id: 4,
      text: 'Thuật ngữ "Machine Learning" được đặt ra vào năm nào?',
      userAnswer: '1980',
      correctAnswer: '1959',
      isCorrect: false
    },
  ]
};

export default function ExamResultPage() {
  const circumference = 2 * Math.PI * 60; // radius = 60
  const offset = circumference - (resultData.percentage / 100) * circumference;

  return (
    <>
      <Navbar />
      
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Result Card */}
          <div className={styles.resultCard}>
            <div className={styles.resultHeader}>
              <div className={styles.leftContent}>
                <span className={styles.badge}>🎉 Hoàn thành xuất sắc</span>
                <h1>Chúc mừng bạn!</h1>
                <p>
                  Bạn đã hoàn thành bài kiểm tra <strong>{resultData.examTitle}</strong>. 
                  Kết quả của bạn rất ấn tượng.
                </p>
                <div className={styles.actions}>
                  <Button variant="primary">
                    🔄 Làm lại bài thi
                  </Button>
                  <Link href="/dashboard">
                    <Button variant="secondary">Quay về Dashboard</Button>
                  </Link>
                </div>
              </div>
              
              {/* Score Circle */}
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
                  <span className={styles.scoreNumber}>{resultData.score}</span>
                  <span className={styles.scoreTotal}>/{resultData.total}</span>
                  <span className={styles.scorePercent}>{resultData.percentage}% Đạt</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statIcon}>✅</span>
                <div>
                  <p className={styles.statLabel}>Câu trả lời đúng</p>
                  <p className={styles.statValue}>{resultData.correctAnswers}</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <span className={`${styles.statIcon} ${styles.incorrect}`}>❌</span>
                <div>
                  <p className={styles.statLabel}>Câu trả lời sai</p>
                  <p className={styles.statValue}>{resultData.incorrectAnswers}</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <span className={`${styles.statIcon} ${styles.time}`}>⏱️</span>
                <div>
                  <p className={styles.statLabel}>Thời gian làm bài</p>
                  <p className={styles.statValue}>{resultData.timeSpent}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Answer Review */}
          <section className={styles.reviewSection}>
            <div className={styles.reviewHeader}>
              <h2>Chi tiết câu trả lời</h2>
              <div className={styles.legend}>
                <span className={styles.legendCorrect}>● Đúng</span>
                <span className={styles.legendIncorrect}>● Sai</span>
              </div>
            </div>

            <div className={styles.questionList}>
              {resultData.questions.map((q) => (
                <div 
                  key={q.id} 
                  className={`${styles.questionItem} ${q.isCorrect ? styles.correct : styles.wrong}`}
                >
                  <span className={styles.questionIcon}>
                    {q.isCorrect ? '✓' : '✕'}
                  </span>
                  <div className={styles.questionContent}>
                    <p className={styles.questionNumber}>Câu hỏi {q.id}</p>
                    <p className={styles.questionText}>{q.text}</p>
                    
                    <div className={`${styles.answerBox} ${q.isCorrect ? styles.correctBg : styles.wrongBg}`}>
                      {q.isCorrect ? (
                        <p>Đáp án của bạn: {q.userAnswer}</p>
                      ) : (
                        <>
                          <p className={styles.wrongAnswer}>
                            Bạn chọn: {q.userAnswer}
                            <span>✕</span>
                          </p>
                          <p className={styles.correctAnswer}>
                            Đáp án đúng: {q.correctAnswer}
                            <span>✓</span>
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <p>© 2024 ThinkAI Platform. All rights reserved.</p>
        </footer>
      </main>
    </>
  );
}
