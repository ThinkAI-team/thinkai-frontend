'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Button from '@/components/ui/Button';

// Mock exam data
const examData = {
  id: 1,
  title: 'LỊCH SỬ VIỆT NAM',
  totalQuestions: 10,
  timeLimit: 30, // minutes
  questions: [
    {
      id: 1,
      text: 'Sự kiện nào đánh dấu sự kết thúc của triều đại nhà Nguyễn trong lịch sử Việt Nam?',
      options: [
        { id: 'A', text: 'Cách mạng tháng Tám năm 1945' },
        { id: 'B', text: 'Vua Bảo Đại thoái vị (30/8/1945)' },
        { id: 'C', text: 'Chiến thắng Điện Biên Phủ (1954)' },
        { id: 'D', text: 'Hiệp định Genève được ký kết' },
      ],
      correctAnswer: 'B'
    },
    {
      id: 2,
      text: 'Ai là người sáng lập ra Đảng Cộng sản Việt Nam?',
      options: [
        { id: 'A', text: 'Hồ Chí Minh' },
        { id: 'B', text: 'Phạm Văn Đồng' },
        { id: 'C', text: 'Võ Nguyên Giáp' },
        { id: 'D', text: 'Trường Chinh' },
      ],
      correctAnswer: 'A'
    },
    // Add more questions as needed
  ]
};

export default function ExamTakingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(examData.timeLimit * 60); // seconds

  const question = examData.questions[currentQuestion] || examData.questions[0];
  const progress = ((currentQuestion + 1) / examData.totalQuestions) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (optionId: string) => {
    setAnswers({ ...answers, [question.id]: optionId });
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < examData.totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleSubmit = () => {
    // TODO: Submit answers to API
    router.push(`/exams/${params.id}/result`);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🎯</span>
          <span className={styles.logoText}>ThinkAI</span>
        </Link>
        
        <div className={styles.timer}>
          <span className={styles.timerIcon}>⏱</span>
          <span className={styles.timerText}>{formatTime(timeLeft)}</span>
        </div>
        
        <div className={styles.headerActions}>
          <button className={styles.exitBtn} onClick={() => router.push('/exams')}>
            Thoát bài thi
          </button>
          <button className={styles.themeBtn}>🌙</button>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Category Tag */}
        <div className={styles.categoryTag}>{examData.title}</div>

        {/* Question Number */}
        <div className={styles.questionNumber}>
          Câu {currentQuestion + 1} <span>/{examData.totalQuestions}</span>
        </div>

        {/* Question Text */}
        <h1 className={styles.questionText}>{question.text}</h1>
        <p className={styles.instruction}>Chọn một đáp án chính xác nhất bên dưới.</p>

        {/* Answer Options */}
        <div className={styles.optionsGrid}>
          {question.options.map((option) => (
            <button
              key={option.id}
              className={`${styles.optionBtn} ${answers[question.id] === option.id ? styles.selected : ''}`}
              onClick={() => handleSelectAnswer(option.id)}
            >
              <span className={styles.optionLabel}>{option.id}</span>
              <span className={styles.optionText}>{option.text}</span>
              {answers[question.id] === option.id && (
                <span className={styles.checkIcon}>✓</span>
              )}
            </button>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        {/* Progress Bar */}
        <div className={styles.progressSection}>
          <span className={styles.progressLabel}>TIẾN ĐỘ</span>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
          </div>
          <span className={styles.progressPercent}>{Math.round(progress)}% HOÀN THÀNH</span>
        </div>

        {/* Navigation */}
        <div className={styles.navigation}>
          <button 
            className={styles.prevBtn}
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            ← Câu trước
          </button>

          {/* Question Dots */}
          <div className={styles.questionDots}>
            {Array.from({ length: examData.totalQuestions }, (_, i) => (
              <span 
                key={i} 
                className={`${styles.dot} ${i === currentQuestion ? styles.currentDot : ''} ${answers[i + 1] ? styles.answeredDot : ''}`}
                onClick={() => setCurrentQuestion(i)}
              />
            ))}
          </div>

          {currentQuestion < examData.totalQuestions - 1 ? (
            <Button variant="primary" onClick={handleNext}>
              Câu sau →
            </Button>
          ) : (
            <Button variant="warm" onClick={handleSubmit}>
              Nộp bài →
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
