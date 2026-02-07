import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import styles from './page.module.css';

// Mock user data
const userData = {
  name: 'Nguyễn Văn A',
  email: 'nguyenvana@example.com',
  phone: '0912 345 678',
  address: 'Hà Nội, Việt Nam',
  bio: 'Đam mê AI và Machine Learning. Luôn tìm kiếm cơ hội để học hỏi và chia sẻ kiến thức với cộng đồng.',
  badge: 'Học viên xuất sắc',
  achievements: [
    { icon: '🏆', name: '7 Ngày Streak', unlocked: true },
    { icon: '📐', name: 'Toán học', unlocked: true },
    { icon: '💬', name: 'Thảo luận', unlocked: true },
    { icon: '🎓', name: 'Học viên', unlocked: true },
    { icon: '✍️', name: 'Tác giả', unlocked: true },
    { icon: '✅', name: 'Xác thực', unlocked: true },
    { icon: '💡', name: 'Sáng tạo', unlocked: true },
    { icon: '🚀', name: 'Khởi đầu', unlocked: true },
    { icon: '💎', name: 'Đại gia', unlocked: false },
    { icon: '👨‍🏫', name: 'Bậc thầy', unlocked: false },
    { icon: '🏅', name: 'Vô địch', unlocked: false },
    { icon: '⭐', name: 'Huyền thoại', unlocked: false },
  ],
  linkedAccounts: [
    { provider: 'Google', icon: '🔵', connected: true },
    { provider: 'Github', icon: '⚫', connected: false },
  ]
};

export default function ProfilePage() {
  return (
    <>
      <Navbar />
      
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb}>
            <Link href="/">Trang chủ</Link>
            <span>/</span>
            <span>Hồ sơ cá nhân</span>
          </nav>

          {/* Profile Card */}
          <div className={styles.profileCard}>
            {/* Header with Avatar */}
            <div className={styles.profileHeader}>
              <div className={styles.avatarWrapper}>
                <div className={styles.avatar}>👤</div>
                <button className={styles.editAvatarBtn}>✏️</button>
              </div>
              <h1>{userData.name}</h1>
              <span className={styles.badge}>🏅 {userData.badge}</span>
              <p className={styles.bio}>{userData.bio}</p>
            </div>

            {/* Content */}
            <div className={styles.profileContent}>
              {/* Left Column - Personal Info */}
              <div className={styles.leftColumn}>
                <section className={styles.section}>
                  <h2>👤 Thông tin cá nhân</h2>
                  
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Họ và tên</label>
                      <input type="text" defaultValue={userData.name} className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Email</label>
                      <div className={styles.inputWithIcon}>
                        <input type="email" defaultValue={userData.email} className={styles.input} />
                        <span className={styles.lockIcon}>🔒</span>
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Số điện thoại</label>
                      <input type="tel" defaultValue={userData.phone} className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Địa chỉ</label>
                      <input type="text" defaultValue={userData.address} className={styles.input} />
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Giới thiệu bản thân</label>
                    <textarea defaultValue={userData.bio} className={styles.textarea} rows={3} />
                  </div>
                </section>

                <section className={styles.section}>
                  <h2>🔗 Tài khoản liên kết</h2>
                  
                  <div className={styles.linkedAccounts}>
                    {userData.linkedAccounts.map((account, idx) => (
                      <div key={idx} className={styles.accountItem}>
                        <span className={styles.accountIcon}>{account.icon}</span>
                        <div className={styles.accountInfo}>
                          <span className={styles.accountName}>{account.provider}</span>
                          <span className={styles.accountStatus}>
                            {account.connected ? 'Đã kết nối' : 'Chưa kết nối'}
                          </span>
                        </div>
                        <button className={account.connected ? styles.disconnectBtn : styles.connectBtn}>
                          {account.connected ? 'Ngắt kết nối' : 'Kết nối'}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <Button variant="primary" className={styles.saveBtn}>
                  💾 Lưu thay đổi
                </Button>
              </div>

              {/* Right Column - Achievements */}
              <div className={styles.rightColumn}>
                <section className={styles.section}>
                  <div className={styles.achievementHeader}>
                    <h2>🏆 Thành tựu</h2>
                    <span className={styles.achievementCount}>
                      {userData.achievements.filter(a => a.unlocked).length}/{userData.achievements.length}
                    </span>
                  </div>
                  
                  <div className={styles.achievementsGrid}>
                    {userData.achievements.map((achievement, idx) => (
                      <div 
                        key={idx} 
                        className={`${styles.achievementItem} ${!achievement.unlocked ? styles.locked : ''}`}
                      >
                        <span className={styles.achievementIcon}>{achievement.icon}</span>
                        <span className={styles.achievementName}>{achievement.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className={styles.badgeTip}>
                    <span className={styles.tipLabel}>MẸO KIẾM BADGE</span>
                    <p>Hoàn thành khóa học Python Cơ bản để mở khóa huy hiệu "Lập trình viên".</p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
