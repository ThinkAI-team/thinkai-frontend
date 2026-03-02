import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import styles from './page.module.css';

// Mock course data
const course = {
  id: 1,
  title: 'Lập trình Java Spring Boot chuyên sâu',
  description: 'Xây dựng ứng dụng web mạnh mẽ, bảo mật và hiệu năng cao với framework phổ biến nhất thế giới Java. Từ cơ bản đến Microservices.',
  rating: 4.8,
  reviews: 1234,
  students: 4500,
  lastUpdated: '10/2023',
  price: 999000,
  originalPrice: 2000000,
  discount: 50,
  videoHours: 12.5,
  articles: 15,
  exercises: 20,
  learningPoints: [
    'Hiểu sâu về kiến trúc Spring Boot và Spring Framework',
    'Xây dựng RESTful API chuẩn mực và bảo mật với Spring Security',
    'Làm việc với Database sử dụng Spring Data JPA & Hibernate',
    'Deploy ứng dụng lên Cloud (AWS/Azure) và sử dụng Docker',
    'Tối ưu hiệu năng và xử lý cache với Redis',
    'Kiến trúc Microservices cơ bản với Spring Cloud',
  ],
  curriculum: [
    { title: '1. Giới thiệu & Cài đặt môi trường', lessons: 3, duration: '15p', isExpanded: true, items: [
      { title: 'Giới thiệu khóa học', duration: '02:30', completed: true },
      { title: 'Cài đặt JDK và IntelliJ IDEA', duration: '08:15', completed: false },
    ]},
    { title: '2. Dependency Injection & IoC Container', lessons: 8, duration: '1h 20p' },
    { title: '3. Spring Data JPA & Hibernate', lessons: 12, duration: '2h 45p' },
    { title: '4. RESTful API với Spring Boot', lessons: 10, duration: '2h 00p' },
  ],
  instructor: {
    name: 'Nguyễn Văn A',
    title: 'Senior Software Architect',
    rating: 4.9,
    courses: 10,
    students: 20000,
    avatar: '/images/instructor.jpg',
    bio: 'Tôi là một kỹ sư phần mềm với hơn 10 năm kinh nghiệm làm việc với hệ sinh thái Java. Tôi từng làm việc tại các công ty công nghệ lớn tại Việt Nam và Singapore. Sứ mệnh của tôi là giúp các bạn trẻ tiếp cận kiến thức lập trình chuẩn quốc tế.'
  },
  reviewStats: {
    average: 4.8,
    total: 1234,
    distribution: [72, 20, 5, 2, 1]
  }
};

export default function CourseDetailPage() {
  return (
    <>
      <Navbar />
      
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Left Content */}
          <div className={styles.content}>
            {/* Breadcrumb */}
            <nav className={styles.breadcrumb}>
              <Link href="/">Trang chủ</Link>
              <span>›</span>
              <Link href="/courses">Lập trình</Link>
              <span>›</span>
              <span>Backend</span>
            </nav>

            {/* Header */}
            <header className={styles.header}>
              <h1>{course.title}</h1>
              <p className={styles.subtitle}>{course.description}</p>
              
              <div className={styles.meta}>
                <span className={styles.rating}>
                  {course.rating} ★★★★★ 
                  <Link href="#reviews">({course.reviews.toLocaleString()} đánh giá)</Link>
                </span>
                <span>{course.students.toLocaleString()} học viên</span>
                <span>Cập nhật: {course.lastUpdated}</span>
              </div>
            </header>

            {/* What you'll learn */}
            <section className={styles.section}>
              <h2>Bạn sẽ học được gì</h2>
              <div className={styles.learningGrid}>
                {course.learningPoints.map((point, idx) => (
                  <div key={idx} className={styles.learningItem}>
                    <span className={styles.checkIcon}>✓</span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Curriculum */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Nội dung khóa học</h2>
                <p className={styles.curriculumMeta}>
                  8 chương • 64 bài học • 12 giờ 30 phút
                </p>
                <button className={styles.expandAll}>Mở rộng tất cả</button>
              </div>
              
              <div className={styles.curriculum}>
                {course.curriculum.map((section, idx) => (
                  <div key={idx} className={styles.curriculumSection}>
                    <div className={styles.sectionTitle}>
                      <span className={styles.expandIcon}>{section.isExpanded ? '∨' : '›'}</span>
                      <span>{section.title}</span>
                      <span className={styles.sectionMeta}>{section.lessons} bài • {section.duration}</span>
                    </div>
                    {section.isExpanded && section.items && (
                      <div className={styles.sectionItems}>
                        {section.items.map((item, iIdx) => (
                          <div key={iIdx} className={styles.lessonItem}>
                            <span className={item.completed ? styles.completedIcon : styles.playIcon}>
                              {item.completed ? '●' : '○'}
                            </span>
                            <span>{item.title}</span>
                            <span className={styles.lessonDuration}>{item.duration}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Description */}
            <section className={styles.section}>
              <h2>Mô tả chi tiết</h2>
              <div className={styles.description}>
                <p>Khóa học này được thiết kế dành cho các lập trình viên Java muốn nâng cao kỹ năng backend của mình lên một tầm cao mới. Spring Boot hiện là framework Java phổ biến nhất cho việc phát triển web hiện đại.</p>
                <p>Trong khóa học này, chúng ta sẽ không chỉ học cú pháp, mà còn học tư duy thiết kế hệ thống. Bạn sẽ được thực hành xây dựng một dự án E-commerce thực tế từ đầu đến cuối, bao gồm tích hợp thanh toán, gửi email, và bảo mật với JWT.</p>
                <h4>Yêu cầu đầu vào:</h4>
                <ul>
                  <li>Kiến thức Java Core vững chắc (OOP, Collection, Stream API).</li>
                  <li>Hiểu biết cơ bản về Database và SQL.</li>
                  <li>Tinh thần ham học hỏi và kiên trì.</li>
                </ul>
              </div>
            </section>

            {/* Instructor */}
            <section className={styles.section}>
              <h2>Giảng viên</h2>
              <div className={styles.instructor}>
                <div className={styles.instructorAvatar}>👨‍🏫</div>
                <div className={styles.instructorInfo}>
                  <h3>{course.instructor.name}</h3>
                  <p className={styles.instructorTitle}>{course.instructor.title}</p>
                  <div className={styles.instructorStats}>
                    <span>★ {course.instructor.rating} Xếp hạng</span>
                    <span>📚 {course.instructor.courses} Khóa học</span>
                    <span>👥 {course.instructor.students.toLocaleString()} Học viên</span>
                  </div>
                  <p className={styles.instructorBio}>{course.instructor.bio}</p>
                </div>
              </div>
            </section>

            {/* Reviews */}
            <section id="reviews" className={styles.section}>
              <h2>Đánh giá từ học viên</h2>
              <div className={styles.reviews}>
                <div className={styles.reviewSummary}>
                  <div className={styles.reviewScore}>
                    <span className={styles.scoreNumber}>{course.reviewStats.average}</span>
                    <span className={styles.stars}>★★★★★</span>
                    <span className={styles.totalReviews}>{course.reviewStats.total.toLocaleString()} đánh giá</span>
                  </div>
                  <div className={styles.reviewBars}>
                    {course.reviewStats.distribution.map((percent, idx) => (
                      <div key={idx} className={styles.reviewBar}>
                        <span>{5 - idx}</span>
                        <div className={styles.barTrack}>
                          <div className={styles.barFill} style={{width: `${percent}%`}}></div>
                        </div>
                        <span>{percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Sidebar - Pricing Card */}
          <aside className={styles.sidebar}>
            <div className={styles.pricingCard}>
              <div className={styles.videoPreview}>
                <div className={styles.playButton}>▶</div>
                <span>Xem trước khóa học</span>
              </div>
              
              <div className={styles.priceRow}>
                <span className={styles.currentPrice}>{course.price.toLocaleString()}đ</span>
                <span className={styles.originalPrice}>{course.originalPrice.toLocaleString()}đ</span>
                <span className={styles.discount}>-{course.discount}%</span>
              </div>
              
              <Button variant="primary" size="lg" className={styles.enrollBtn}>
                Đăng ký ngay
              </Button>
              
              <p className={styles.guarantee}>Hoàn tiền trong 30 ngày nếu không hài lòng</p>
              
              <div className={styles.includes}>
                <h4>Khóa học bao gồm:</h4>
                <ul>
                  <li>🕐 {course.videoHours} giờ video theo yêu cầu</li>
                  <li>📄 {course.articles} bài viết chuyên sâu</li>
                  <li>💻 {course.exercises} bài tập coding</li>
                  <li>♾️ Truy cập trọn đời</li>
                  <li>📱 Học trên Mobile và TV</li>
                  <li>🏆 Chứng chỉ hoàn thành</li>
                </ul>
              </div>
              
              <div className={styles.actions}>
                <button className={styles.shareBtn}>Chia sẻ</button>
                <button className={styles.giftBtn}>Tặng quà</button>
              </div>
              
              <div className={styles.businessCTA}>
                <p>Đào tạo doanh nghiệp?</p>
                <span>Nhận quyền truy cập vào 5,000+ khóa học cho đội ngũ của bạn.</span>
                <Link href="/business">ThinkAI Business</Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}
