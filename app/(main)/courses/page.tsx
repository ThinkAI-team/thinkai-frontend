import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import styles from './page.module.css';

// Mock data for courses
const courses = [
  {
    id: 1,
    title: 'Nhập môn Trí tuệ Nhân tạo & Machine Learning',
    description: 'Tìm hiểu cơ bản về AI, cách xây dựng mô hình máy học đầu tiên của...',
    category: 'CÔNG NGHỆ',
    rating: 4.9,
    reviews: 1200,
    instructor: 'Minh Đạt',
    price: '899.000đ',
    image: '/images/course-ai.jpg',
    isNew: true
  },
  {
    id: 2,
    title: 'UI/UX Design: Tư duy thiết kế tối giản',
    description: 'Học cách tạo ra những giao diện người dùng đẹp mắt, tinh tế và đế...',
    category: 'THIẾT KẾ',
    rating: 4.8,
    reviews: 856,
    instructor: 'Lan Hương',
    price: '1.200.000đ',
    image: '/images/course-ux.jpg',
    isNew: false
  },
  {
    id: 3,
    title: 'Data Analysis cho Business Intelligence',
    description: 'Biến dữ liệu thô thành thông tin chi tiết có thể hành động để thúc đẩy...',
    category: 'KINH DOANH',
    rating: 4.7,
    reviews: 2400,
    instructor: 'Quang Huy',
    price: '1.500.000đ',
    image: '/images/course-data.jpg',
    isNew: false
  },
  {
    id: 4,
    title: 'ReactJS & NextJS: Xây dựng Web App hiện đại',
    description: 'Khóa học chuyên sâu từ cơ bản đến nâng cao về hệ sinh thái React.',
    category: 'CÔNG NGHỆ',
    rating: 5.0,
    reviews: 320,
    instructor: 'Tuấn Anh',
    price: '1.800.000đ',
    image: '/images/course-react.jpg',
    isNew: false
  },
  {
    id: 5,
    title: 'Tiếng Anh Giao Tiếp cho người đi làm',
    description: 'Tự tin giao tiếp trong môi trường công sở quốc tế chỉ sau 3 tháng.',
    category: 'NGOẠI NGỮ',
    rating: 4.5,
    reviews: 5600,
    instructor: 'Ms. Jessica',
    price: '699.000đ',
    image: '/images/course-english.jpg',
    isNew: false
  },
  {
    id: 6,
    title: 'Photoshop Mastery: Từ cơ bản đến chuyên gia',
    description: 'Chỉnh sửa ảnh, thiết kế poster, banner quảng cáo chuyên nghiệp.',
    category: 'THIẾT KẾ',
    rating: 4.9,
    reviews: 120,
    instructor: 'Đức Mạnh',
    price: '599.000đ',
    image: '/images/course-photoshop.jpg',
    isNew: true
  }
];

const categories = ['Công nghệ & AI', 'Thiết kế & Sáng tạo', 'Kinh doanh', 'Ngoại ngữ'];
const levels = ['Người mới bắt đầu', 'Trung cấp', 'Nâng cao'];

export default function CoursesPage() {
  return (
    <>
      <Navbar />
      
      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <h1>Khám phá tri thức<br/><em>vượt giới hạn</em></h1>
          <p>Hơn 500 khóa học chất lượng cao từ các chuyên gia hàng đầu. Học mọi lúc,<br/>mọi nơi với trải nghiệm mượt mà và tập trung.</p>
          
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm khóa học, kỹ năng, giáo viên..." 
              className={styles.searchInput}
            />
          </div>
        </section>

        {/* Content */}
        <section className={styles.content}>
          {/* Sidebar Filter */}
          <aside className={styles.sidebar}>
            <div className={styles.filterHeader}>
              <h3>Bộ lọc</h3>
              <button className={styles.clearBtn}>Xóa tất cả</button>
            </div>

            <div className={styles.filterGroup}>
              <h4>CẤP ĐỘ</h4>
              {levels.map((level, idx) => (
                <label key={idx} className={styles.checkbox}>
                  <input type="radio" name="level" />
                  <span>{level}</span>
                </label>
              ))}
            </div>

            <div className={styles.filterGroup}>
              <h4>GIÁ</h4>
              <label className={styles.checkbox}>
                <input type="radio" name="price" />
                <span>Miễn phí</span>
              </label>
              <label className={styles.checkbox}>
                <input type="radio" name="price" />
                <span>Có trả phí</span>
              </label>
            </div>

            <div className={styles.filterGroup}>
              <h4>CHỦ ĐỀ</h4>
              {categories.map((cat, idx) => (
                <label key={idx} className={styles.checkbox}>
                  <input type="checkbox" defaultChecked={idx === 0} />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </aside>

          {/* Course Grid */}
          <div className={styles.courseSection}>
            <div className={styles.courseHeader}>
              <p>Hiển thị <strong>12</strong> trên <strong>56</strong> khóa học</p>
              <div className={styles.sortBy}>
                <span>Sắp xếp theo:</span>
                <select>
                  <option>Phổ biến nhất</option>
                  <option>Mới nhất</option>
                  <option>Giá thấp nhất</option>
                </select>
              </div>
            </div>

            <div className={styles.courseGrid}>
              {courses.map(course => (
                <Link href={`/courses/${course.id}`} key={course.id} className={styles.courseCard}>
                  <div className={styles.courseImage}>
                    <span className={styles.categoryTag}>{course.category}</span>
                    {course.isNew && <span className={styles.newTag}>Mới</span>}
                  </div>
                  <div className={styles.courseInfo}>
                    <div className={styles.ratingRow}>
                      <span className={styles.star}>★</span>
                      <span className={styles.rating}>{course.rating}</span>
                      <span className={styles.reviews}>({course.reviews.toLocaleString()})</span>
                    </div>
                    <h3>{course.title}</h3>
                    <p>{course.description}</p>
                    <div className={styles.courseFooter}>
                      <div className={styles.instructor}>
                        <span className={styles.avatar}>👤</span>
                        <span>{course.instructor}</span>
                      </div>
                      <span className={styles.price}>{course.price}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className={styles.pagination}>
              <button className={styles.pageBtn} disabled>‹</button>
              <button className={`${styles.pageBtn} ${styles.active}`}>1</button>
              <button className={styles.pageBtn}>2</button>
              <button className={styles.pageBtn}>3</button>
              <span>...</span>
              <button className={styles.pageBtn}>8</button>
              <button className={styles.pageBtn}>›</button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
