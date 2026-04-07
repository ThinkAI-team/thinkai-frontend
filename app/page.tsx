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
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroGrid}>
              <div className={styles.heroContent}>
                <span className={styles.heroLabel}>ThinkAI Learning Workspace</span>
                <h1 className={styles.heroTitle}>
                  Học tập sâu, tập trung và có định hướng mỗi ngày
                </h1>
                <p className={styles.heroSubtitle}>
                  ThinkAI gom toàn bộ khóa học, bài thi và BiliBily vào một luồng làm việc duy nhất.
                  Tối ưu cho học viên lẫn giảng viên với giao diện nhẹ, rõ và ít nhiễu.
                </p>

                <div className={styles.heroActions}>
                  <Link href="/dashboard">
                    <Button variant="primary" size="lg">Vào dashboard</Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="secondary" size="lg">Tạo tài khoản</Button>
                  </Link>
                </div>

                <div className={styles.heroMeta}>
                  <span>Hỗ trợ học 24/7</span>
                  <span>Luồng học tập liền mạch</span>
                  <span>Tích hợp BiliBily</span>
                </div>
              </div>

              <div className={styles.previewPanel}>
                <div className={styles.panelTop}>
                  <div className={styles.panelDots}>
                    <span />
                    <span />
                    <span />
                  </div>
                  <p>thinkai.edu.vn/dashboard</p>
                </div>

                <div className={styles.panelBody}>
                  <aside className={styles.panelSidebar}>
                    <span>Dashboard</span>
                    <span>Courses</span>
                    <span>Exams</span>
                    <span>BiliBily</span>
                  </aside>

                  <div className={styles.panelMain}>
                    <h3>Tiếp tục khóa học TOEIC Mastery</h3>
                    <p>Đã hoàn thành 75% lộ trình • 2 bài thi đang chờ</p>

                    <div className={styles.panelProgress}>
                      <div className={styles.panelProgressFill} />
                    </div>

                    <div className={styles.panelStats}>
                      <article>
                        <strong>12</strong>
                        <span>Bài học tuần này</span>
                      </article>
                      <article>
                        <strong>89%</strong>
                        <span>Độ chính xác luyện tập</span>
                      </article>
                    </div>

                    <Link href="/ai-tutor" className={styles.panelAction}>
                      Mở BiliBily
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.features}>
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <h2>Tập trung vào điều quan trọng nhất: kết quả học tập</h2>
              <p>
                Thiết kế giao diện ưu tiên tính rõ ràng, giảm thao tác rườm rà và giúp bạn luôn biết bước tiếp theo.
              </p>
            </header>

            <div className={styles.featureGrid}>
              <article className={styles.featureCard}>
                <h3>Lộ trình cá nhân hóa</h3>
                <p>Theo dõi tiến độ theo từng khóa, từng bài học, từng kỹ năng.</p>
              </article>
              <article className={styles.featureCard}>
                <h3>Bài thi theo mục tiêu</h3>
                <p>Tạo đề luyện tập đúng định dạng, có chấm điểm và phân tích kết quả.</p>
              </article>
              <article className={styles.featureCard}>
                <h3>BiliBily theo ngữ cảnh</h3>
                <p>Hỏi đáp ngay trong luồng học, giữ nguyên ngữ cảnh khóa học hiện tại.</p>
              </article>
              <article className={styles.featureCard}>
                <h3>Teacher workspace riêng</h3>
                <p>Giảng viên có dashboard, course management và question bank độc lập.</p>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.partners}>
          <div className={styles.container}>
            <p className={styles.partnersTitle}>Được tin dùng trong nhiều môi trường đào tạo</p>
            <div className={styles.partnerList}>
              <span>University Hub</span>
              <span>Skill Academy</span>
              <span>Future Lab</span>
              <span>EduTech Network</span>
            </div>
          </div>
        </section>

        <section className={styles.values}>
          <div className={styles.container}>
            <h2>Giá trị cốt lõi</h2>
            <p>
              Đơn giản trong thao tác, nghiêm túc trong chất lượng và nhất quán trong toàn bộ trải nghiệm.
            </p>
            <div className={styles.valueTags}>
              <span>Rõ ràng</span>
              <span>Hiệu quả</span>
              <span>Bền vững</span>
              <span>Tập trung</span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
