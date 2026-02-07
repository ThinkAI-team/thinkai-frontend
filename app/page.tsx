import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import styles from './page.module.css';

export default function Home() {
  return (
    <>
      <Navbar />
      
      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              chào mừng đến với<br/>
              một kỷ nguyên <em>học tập</em><br/>
              mới
            </h1>
            <p className={styles.heroSubtitle}>
              Nền tảng giáo dục thông minh với gia sư AI 24/7. Được thiết kế tinh tế, tập<br/>
              trung vào sự riêng tư và cá nhân hóa trải nghiệm học tập của bạn.
            </p>
            <div className={styles.heroButtons}>
              <Link href="/register">
                <Button variant="primary" size="lg">Bắt đầu ngay →</Button>
              </Link>
              <Link href="/about">
                <Button variant="secondary" size="lg">Tìm hiểu thêm 💛</Button>
              </Link>
            </div>
            
            {/* Icons */}
            <div className={styles.heroIcons}>
              <span>💬</span>
              <span>📚</span>
              <span>📖</span>
              <span>🧠</span>
              <span>💡</span>
            </div>
          </div>

          {/* Browser Mockup */}
          <div className={styles.mockupWrapper}>
            <div className={styles.mockup}>
              <div className={styles.mockupHeader}>
                <div className={styles.mockupDots}>
                  <span className={styles.dotRed}></span>
                  <span className={styles.dotYellow}></span>
                  <span className={styles.dotGreen}></span>
                </div>
                <span className={styles.mockupUrl}>thinkai.edu.vn/dashboard</span>
              </div>
              <div className={styles.mockupContent}>
                <div className={styles.mockupSidebar}>
                  {/* Sidebar placeholder */}
                </div>
                <div className={styles.mockupMain}>
                  <p className={styles.mockupGreeting}>XIN CHÀO, ALEX</p>
                  <h3 className={styles.mockupTitle}>Tiếp tục hành trình học tập</h3>
                  
                  <div className={styles.mockupCards}>
                    <div className={styles.mockupCard}>
                      <div className={styles.mockupCardHeader}>
                        <span>Toán cao cấp II</span>
                        <span className={styles.mathIcon}>∑</span>
                      </div>
                      <p className={styles.mockupProgress}>Tiến độ: 75%</p>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFill}></div>
                      </div>
                      <Button variant="secondary" size="sm">Tiếp tục</Button>
                    </div>
                    <div className={styles.mockupCard}>
                      <div className={styles.successBadge}>✓</div>
                      <p className={styles.completedNumber}>12</p>
                      <p className={styles.completedText}>Bài tập hoàn thành</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* AI Tutor Button */}
              <div className={styles.aiTutorButton}>
                <span>💬</span> Hỏi AI Tutor
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.features}>
          <div className={styles.container}>
            <div className={styles.featuresHeader}>
              <h2>Hiệu suất <em>tối đa</em>.</h2>
              <p>
                ThinkAI được tích hợp các tính năng giúp bạn tập trung và học tập hiệu quả.<br/>
                Không xao nhãng, chỉ có kiến thức.
              </p>
            </div>
            
            <div className={styles.featuresGrid}>
              <div className={styles.featuresList}>
                <div className={styles.featureItem}>
                  <h4>Không gian làm việc</h4>
                  <p>Tổ chức các môn học vào các Workspace riêng biệt để giữ cho dự án học tập của bạn ngăn nắp.</p>
                </div>
                <div className={styles.featureItem}>
                  <h4>Chế độ tập trung</h4>
                  <p>Ẩn các thanh công cụ không cần thiết khi bạn đang làm bài kiểm tra hoặc đọc tài liệu.</p>
                </div>
                <div className={styles.featureItem}>
                  <h4>Split View</h4>
                  <p>Xem bài giảng video và ghi chú cùng lúc trên một màn hình chia đôi tiện lợi.</p>
                </div>
              </div>
              
              <div className={styles.featuresImage}>
                <div className={styles.notesCard}>
                  <div className={styles.noteHeader}></div>
                  <div className={styles.noteLine}></div>
                  <div className={styles.noteLine}></div>
                  <div className={styles.noteLineShort}></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partners Section */}
        <section className={styles.partners}>
          <p className={styles.partnersTitle}>ĐƯỢC TIN DÙNG BỞI CÁC TỔ CHỨC GIÁO DỤC</p>
          <div className={styles.partnersLogos}>
            <span>🎓 UNI<strong>VERSITY</strong></span>
            <span>📚 EDU<strong>TECH</strong></span>
            <span>🌐 GLO<strong>BAL</strong></span>
            <span>🚀 FUTURE<strong>LAB</strong></span>
          </div>
        </section>

        {/* Values Section */}
        <section className={styles.values}>
          <div className={styles.container}>
            <h2>Giá trị <em>cốt lõi</em></h2>
            <p className={styles.valuesSubtitle}>
              Chúng tôi tạo ra ThinkAI không chỉ là một ứa tiện, mà là một sự cân thiết để đảm bảo việc học luôn đạt được sự cân<br/>
              bằng giữa hiệu quả, sáng tạo và quyền riêng tư.
            </p>
            <div className={styles.valuesTags}>
              <span className={styles.valueTag}>🔒 Riêng tư và an toàn</span>
              <span className={styles.valueTag}>✓ Đơn giản nhưng mạnh mẽ</span>
              <span className={styles.valueTag}>✓ Mã nguồn mở (một phần)</span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
