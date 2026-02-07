'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

// Mock lesson data
const lessonData = {
  title: 'Bài 12: JWT Authentication',
  description: 'Học cách bảo mật ứng dụng của bạn bằng JSON Web Tokens (JWT) trong môi trường NodeJS.',
  content: `Trong bài học này, chúng ta sẽ đi sâu vào cơ chế hoạt động của JWT. Authentication là một phần không thể thiếu của bất kỳ ứng dụng hiện đại nào. Chúng ta sẽ tìm hiểu về:`,
  learningPoints: [
    'Cấu trúc của một JWT (Header, Payload, Signature)',
    'Cách tạo và xác thực Token',
    'Lưu trữ Token an toàn ở Client (HttpOnly Cookies vs LocalStorage)',
    'Middleware bảo vệ Route',
  ],
  note: 'Lưu ý: Đảm bảo bạn đã hoàn thành bài về Express Middleware trước khi bắt đầu bài này.',
  resources: [
    { icon: '💻', title: 'Source Code (Starter)', subtitle: 'GitHub Repository' },
    { icon: '📄', title: 'Slide bài giảng', subtitle: 'PDF - 2.4MB' },
  ],
  breadcrumb: ['Backend Development', 'NodeJS Advanced'],
};

const curriculum = {
  currentPart: 'Phần 3: Authentication & Security',
  lessons: [
    { id: 10, title: 'Bài 10: Giới thiệu về Auth', duration: '15:00', completed: true },
    { id: 11, title: 'Bài 11: Session vs Token', duration: '22:30', completed: true },
    { id: 12, title: 'Bài 12: JWT Authentication', duration: '45:30', current: true },
    { id: 13, title: 'Bài 13: Refresh Tokens', duration: '30:15', locked: true },
    { id: 14, title: 'Bài 14: OAuth2 & Google Login', duration: '55:00', locked: true },
  ],
  nextPart: {
    title: 'PHẦN 4: DATABASE DESIGN',
    lessons: [
      { id: 15, title: 'Bài 15: MongoDB Schema Design', duration: '40:10', locked: true },
    ]
  }
};

export default function LearningRoomPage() {
  const [progress] = useState(65);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🎯</span>
          <span className={styles.logoText}>ThinkAI</span>
        </Link>
        
        <nav className={styles.nav}>
          <Link href="#" className={styles.navActive}>Học tập</Link>
          <Link href="#">Thảo luận</Link>
          <Link href="#">Tài liệu</Link>
        </nav>
        
        <div className={styles.headerRight}>
          <div className={styles.progressBadge}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
            </div>
            <span>{progress}%</span>
          </div>
          <button className={styles.notifBtn}>🔔</button>
          <div className={styles.user}>
            <span>Minh Trí</span>
            <div className={styles.avatar}>👤</div>
          </div>
          <button className={styles.themeBtn}>🌙</button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Left Content */}
        <div className={styles.content}>
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb}>
            {lessonData.breadcrumb.map((item, idx) => (
              <span key={idx}>
                <Link href="#">{item}</Link>
                {idx < lessonData.breadcrumb.length - 1 && ' › '}
              </span>
            ))}
          </nav>

          {/* Video Player */}
          <div className={styles.videoPlayer}>
            <div className={styles.playButton}>▶</div>
          </div>

          {/* Lesson Info */}
          <div className={styles.lessonInfo}>
            <div className={styles.lessonHeader}>
              <h1>{lessonData.title}</h1>
              <div className={styles.lessonActions}>
                <button className={styles.actionBtn}>👍 Thích</button>
                <button className={styles.actionBtn}>↗ Chia sẻ</button>
              </div>
            </div>
            <p className={styles.lessonDesc}>{lessonData.description}</p>
          </div>

          {/* Resources */}
          <section className={styles.resources}>
            <h3>📄 Tài nguyên bài học</h3>
            <div className={styles.resourceGrid}>
              {lessonData.resources.map((res, idx) => (
                <a key={idx} href="#" className={styles.resourceCard}>
                  <span className={styles.resourceIcon}>{res.icon}</span>
                  <div>
                    <span className={styles.resourceTitle}>{res.title}</span>
                    <span className={styles.resourceSubtitle}>{res.subtitle}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* Lesson Content */}
          <section className={styles.lessonContent}>
            <p>{lessonData.content}</p>
            <ul>
              {lessonData.learningPoints.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
            <p className={styles.note}>{lessonData.note}</p>
          </section>
        </div>

        {/* Right Sidebar - Curriculum */}
        <aside className={styles.sidebar}>
          <h2>Nội dung khóa học</h2>
          <p className={styles.partTitle}>{curriculum.currentPart}</p>

          <div className={styles.lessonList}>
            {curriculum.lessons.map((lesson) => (
              <div 
                key={lesson.id} 
                className={`${styles.lessonItem} ${lesson.current ? styles.currentLesson : ''} ${lesson.locked ? styles.locked : ''}`}
              >
                <span className={styles.lessonIcon}>
                  {lesson.completed ? '✅' : lesson.current ? '▶' : '🔒'}
                </span>
                <div className={styles.lessonDetails}>
                  <span className={styles.lessonName}>{lesson.title}</span>
                  {lesson.current && <span className={styles.learningBadge}>Đang học</span>}
                  <span className={styles.lessonDuration}>{lesson.duration}</span>
                </div>
              </div>
            ))}
          </div>

          <p className={styles.nextPartTitle}>{curriculum.nextPart.title}</p>
          <div className={styles.lessonList}>
            {curriculum.nextPart.lessons.map((lesson) => (
              <div key={lesson.id} className={`${styles.lessonItem} ${styles.locked}`}>
                <span className={styles.lessonIcon}>🔒</span>
                <div className={styles.lessonDetails}>
                  <span className={styles.lessonName}>{lesson.title}</span>
                  <span className={styles.lessonDuration}>{lesson.duration}</span>
                </div>
              </div>
            ))}
          </div>

          {/* AI Tutor */}
          <Link href="/ai-tutor" className={styles.aiTutorBtn}>
            <span className={styles.aiIcon}>✨</span>
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
