'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import styles from './page.module.css';

const tabs = [
  { id: 'profile', icon: '👤', label: 'Hồ sơ' },
  { id: 'notifications', icon: '🔔', label: 'Thông báo' },
  { id: 'security', icon: '🔒', label: 'Bảo mật' },
  { id: 'subscription', icon: '💳', label: 'Gói đăng ký' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [darkMode, setDarkMode] = useState(false);

  return (
    <>
      <Navbar />
      
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Header */}
          <header className={styles.header}>
            <h1>Cài đặt</h1>
            <p>Quản lý thông tin cá nhân và tùy chọn trải nghiệm.</p>
          </header>

          <div className={styles.content}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.tabBtn} ${activeTab === tab.id ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </aside>

            {/* Main Content */}
            <div className={styles.mainContent}>
              {activeTab === 'profile' && (
                <>
                  {/* Profile Section */}
                  <section className={styles.section}>
                    <div className={styles.profileSection}>
                      <div className={styles.avatarSection}>
                        <div className={styles.avatar}>👤</div>
                        <button className={styles.editAvatarBtn}>✏️</button>
                        <span className={styles.avatarLabel}>Ảnh đại diện</span>
                      </div>
                      
                      <div className={styles.formFields}>
                        <div className={styles.formRow}>
                          <div className={styles.formGroup}>
                            <label>Họ và tên</label>
                            <input type="text" defaultValue="Nguyễn Văn An" className={styles.input} />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Tên hiển thị</label>
                            <input type="text" defaultValue="@annguyen" className={styles.input} />
                          </div>
                        </div>
                        
                        <div className={styles.formGroup}>
                          <label>Địa chỉ Email</label>
                          <input type="email" defaultValue="an.nguyen@example.com" className={styles.input} />
                        </div>
                        
                        <div className={styles.formGroup}>
                          <label>Giới thiệu ngắn</label>
                          <textarea 
                            defaultValue="Người đam mê học hỏi và khám phá công nghệ mới." 
                            className={styles.textarea} 
                            rows={3} 
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Appearance Section */}
                  <section className={styles.section}>
                    <h2>Giao diện</h2>
                    <div className={styles.toggleRow}>
                      <div className={styles.toggleInfo}>
                        <span className={styles.toggleIcon}>🌙</span>
                        <div>
                          <span className={styles.toggleLabel}>Chế độ tối</span>
                          <span className={styles.toggleDesc}>Giảm mỏi mắt và tăng sự tập trung</span>
                        </div>
                      </div>
                      <label className={styles.toggle}>
                        <input 
                          type="checkbox" 
                          checked={darkMode}
                          onChange={(e) => setDarkMode(e.target.checked)}
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </div>
                  </section>
                </>
              )}

              {activeTab === 'notifications' && (
                <section className={styles.section}>
                  <h2>Thông báo</h2>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleIcon}>📧</span>
                      <div>
                        <span className={styles.toggleLabel}>Email thông báo</span>
                        <span className={styles.toggleDesc}>Nhận thông báo qua email</span>
                      </div>
                    </div>
                    <label className={styles.toggle}>
                      <input type="checkbox" defaultChecked />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleIcon}>🔔</span>
                      <div>
                        <span className={styles.toggleLabel}>Push notifications</span>
                        <span className={styles.toggleDesc}>Nhận thông báo trên trình duyệt</span>
                      </div>
                    </div>
                    <label className={styles.toggle}>
                      <input type="checkbox" />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </section>
              )}

              {activeTab === 'security' && (
                <section className={styles.section}>
                  <h2>Bảo mật</h2>
                  <div className={styles.formGroup}>
                    <label>Mật khẩu hiện tại</label>
                    <input type="password" placeholder="••••••••" className={styles.input} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Mật khẩu mới</label>
                    <input type="password" placeholder="••••••••" className={styles.input} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Xác nhận mật khẩu mới</label>
                    <input type="password" placeholder="••••••••" className={styles.input} />
                  </div>
                </section>
              )}

              {activeTab === 'subscription' && (
                <section className={styles.section}>
                  <h2>Gói đăng ký</h2>
                  <div className={styles.subscriptionCard}>
                    <div className={styles.planInfo}>
                      <span className={styles.planName}>Gói Miễn Phí</span>
                      <p>Truy cập giới hạn các khóa học và tính năng cơ bản</p>
                    </div>
                    <Button variant="primary">Nâng cấp Premium</Button>
                  </div>
                </section>
              )}

              {/* Action Buttons */}
              <div className={styles.actions}>
                <button className={styles.cancelBtn}>Hủy bỏ</button>
                <Button variant="primary">Lưu thay đổi →</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <p>© 2024 ThinkAI. Inspired by Zen Browser.</p>
        </footer>
      </main>
    </>
  );
}
