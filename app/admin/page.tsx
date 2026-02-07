'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

const sidebarItems = [
  { id: 'overview', icon: '📊', label: 'Tổng quan', active: true },
  { id: 'users', icon: '👥', label: 'Người dùng' },
  { id: 'courses', icon: '📚', label: 'Khóa học' },
  { id: 'reports', icon: '📈', label: 'Báo cáo' },
  { id: 'settings', icon: '⚙️', label: 'Cài đặt' },
];

const statsData = [
  { icon: '👥', value: '2,543', label: 'Tổng người dùng', change: '+12%', positive: true },
  { icon: '📚', value: '142', label: 'Khóa học hoạt động', change: '+5%', positive: true },
  { icon: '⏱️', value: '45p', label: 'Thời gian học TB', change: '0%', positive: false },
  { icon: '💰', value: '890tr', label: 'Doanh thu tháng', change: '+8%', positive: true },
];

const usersData = [
  { name: 'Nguyễn Văn A', email: 'nguyen.a@example.com', role: 'Học viên', date: '12/10/2023', status: 'active' },
  { name: 'Trần Thị B', email: 'tranthib@gmail.com', role: 'Giảng viên', date: '11/10/2023', status: 'pending' },
  { name: 'Lê Văn C', email: 'levanc@outlook.com', role: 'Học viên', date: '10/10/2023', status: 'offline' },
  { name: 'Phạm D', email: 'pham.d@company.vn', role: 'Premium', date: '09/10/2023', status: 'active' },
];

const chartData = [12, 15, 19, 22, 25, 28, 32, 35, 38, 42, 44];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const maxValue = Math.max(...chartData);
  
  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>T</span>
          <span className={styles.logoText}>ThinkAI</span>
        </Link>

        <nav className={styles.nav}>
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.themeBtn}>🎨 Chế độ giao diện</button>
          <div className={styles.adminInfo}>
            <div className={styles.adminAvatar}>👤</div>
            <div>
              <span className={styles.adminName}>Quản trị viên</span>
              <span className={styles.adminEmail}>admin@thinkai.vn</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1>Chào mừng trở lại, <span className={styles.adminHighlight}>Admin</span></h1>
            <p>Dưới đây là tổng quan hệ thống ThinkAI hôm nay.</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.searchBar}>
              <span>🔍</span>
              <input type="text" placeholder="Tìm kiếm..." />
            </div>
            <button className={styles.downloadBtn}>
              📥 Tải báo cáo
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          {statsData.map((stat, idx) => (
            <div key={idx} className={styles.statCard}>
              <div className={styles.statIcon}>{stat.icon}</div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
              <span className={`${styles.statChange} ${stat.positive ? styles.positive : ''}`}>
                {stat.change}
              </span>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className={styles.chartsRow}>
          {/* Line Chart */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>Tăng trưởng người dùng</h3>
              <select className={styles.chartSelect}>
                <option>7 ngày qua</option>
                <option>30 ngày qua</option>
              </select>
            </div>
            <div className={styles.chart}>
              <div className={styles.chartY}>
                {[45, 35, 25, 15, 5, 0].map((v) => (
                  <span key={v}>{v}</span>
                ))}
              </div>
              <div className={styles.chartArea}>
                <svg viewBox="0 0 100 50" preserveAspectRatio="none" className={styles.chartSvg}>
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F87171" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#F87171" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path
                    d={`M 0 ${50 - (chartData[0] / maxValue) * 45} ${chartData.map((v, i) => `L ${(i / (chartData.length - 1)) * 100} ${50 - (v / maxValue) * 45}`).join(' ')} L 100 50 L 0 50 Z`}
                    fill="url(#gradient)"
                  />
                  <path
                    d={`M 0 ${50 - (chartData[0] / maxValue) * 45} ${chartData.map((v, i) => `L ${(i / (chartData.length - 1)) * 100} ${50 - (v / maxValue) * 45}`).join(' ')}`}
                    fill="none"
                    stroke="#F87171"
                    strokeWidth="0.5"
                  />
                </svg>
              </div>
            </div>
            <div className={styles.chartX}>
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
          </div>

          {/* Premium Card */}
          <div className={styles.premiumCard}>
            <span className={styles.premiumIcon}>✨</span>
            <h3>ThinkAI Premium</h3>
            <p>Đã có 450 người dùng nâng cấp lên gói Premium trong tháng này.</p>
            <Link href="#" className={styles.premiumLink}>Xem chi tiết →</Link>
          </div>
        </div>

        {/* Users Table */}
        <section className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h3>Người dùng mới nhất</h3>
            <Link href="#" className={styles.viewAll}>Xem tất cả</Link>
          </div>
          
          <table className={styles.table}>
            <thead>
              <tr>
                <th>TÊN NGƯỜI DÙNG</th>
                <th>EMAIL</th>
                <th>VAI TRÒ</th>
                <th>NGÀY THAM GIA</th>
                <th>TRẠNG THÁI</th>
                <th>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {usersData.map((user, idx) => (
                <tr key={idx}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.userAvatar}>{user.name.charAt(0)}</div>
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.date}</td>
                  <td>
                    <span className={`${styles.status} ${styles[user.status]}`}>
                      {user.status === 'active' ? 'Hoạt động' : 
                       user.status === 'pending' ? 'Chờ duyệt' : 'Ngoại tuyến'}
                    </span>
                  </td>
                  <td>
                    <button className={styles.actionBtn}>⋮</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.tableFooter}>
            <span>Hiển thị 4 trong số 2,543 người dùng</span>
            <div className={styles.pagination}>
              <button>Trước</button>
              <button className={styles.pageActive}>1</button>
              <button>2</button>
              <button>3</button>
              <span>...</span>
              <button>Sau</button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <p>© 2023 ThinkAI. Thiết kế lấy cảm hứng từ sự tối giản.</p>
        </footer>
      </main>
    </div>
  );
}
