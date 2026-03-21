'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import styles from './page.module.css';
import { getCurrentUser, AuthResponse, updatePassword } from '@/services/auth';
import {
  getProfile,
  updateProfile,
  type ProfileResponse,
} from '@/services/user';
import {
  getAISettings,
  updateAISettings,
  type AISettings,
} from '@/services/ai-tutor';

const tabs = [
  { id: 'profile', icon: '👤', label: 'Hồ sơ' },
  { id: 'ai', icon: '🤖', label: 'AI Tutor' },
  { id: 'notifications', icon: '🔔', label: 'Thông báo' },
  { id: 'security', icon: '🔒', label: 'Bảo mật' },
  { id: 'subscription', icon: '💳', label: 'Gói đăng ký' },
];

const defaultAISettings: AISettings = {
  language: 'VI',
  responseLength: 'MEDIUM',
  communicationStyle: 'FRIENDLY',
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [darkMode, setDarkMode] = useState(false);
  
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [authInfo, setAuthInfo] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalMessage, setGlobalMessage] = useState({ text: '', type: '' });
  const [aiSettings, setAISettings] = useState<AISettings>(defaultAISettings);
  const [savingAISettings, setSavingAISettings] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profData, authData] = await Promise.all([
        getProfile().catch(() => null),
        getCurrentUser().catch(() => null),
      ]);
      if (profData) setProfile(profData);
      if (authData) setAuthInfo(authData);
      const settings = await getAISettings().catch(() => defaultAISettings);
      setAISettings(settings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalMessage({ text: '', type: '' });
    try {
      if (profile) {
        const updated = await updateProfile({
          fullName: profile.fullName,
          phoneNumber: profile.phoneNumber || undefined
        });
        setProfile(updated);
        setGlobalMessage({ text: 'Cập nhật hồ sơ thành công', type: 'success' });
      }
    } catch (err: any) {
      setGlobalMessage({ text: err.message || 'Lỗi cập nhật hồ sơ', type: 'error' });
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalMessage({ text: '', type: '' });
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setGlobalMessage({ text: 'Mật khẩu xác nhận không khớp', type: 'error' });
      return;
    }
    
    try {
      await updatePassword(
        authInfo?.hasPassword ? passwordData.currentPassword : null,
        passwordData.newPassword,
        passwordData.confirmPassword
      );
      setGlobalMessage({ text: 'Đổi mật khẩu thành công', type: 'success' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      // Reload auth info
      const authData = await getCurrentUser();
      setAuthInfo(authData);
    } catch (err: any) {
      setGlobalMessage({ text: err.message || 'Lỗi đổi mật khẩu', type: 'error' });
    }
  };

  const handleAISettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalMessage({ text: '', type: '' });
    setSavingAISettings(true);
    try {
      await updateAISettings(aiSettings);
      setGlobalMessage({ text: 'Đã cập nhật AI settings thành công', type: 'success' });
    } catch (err: any) {
      setGlobalMessage({ text: err.message || 'Lỗi cập nhật AI settings', type: 'error' });
    } finally {
      setSavingAISettings(false);
    }
  };

  const getUserInitial = () => {
    return profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : '?';
  };

  if (loading) {
    return <div style={{textAlign: 'center', padding: '5rem'}}>Đang tải...</div>;
  }

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
                  onClick={() => {
                    setActiveTab(tab.id);
                    setGlobalMessage({ text: '', type: '' });
                  }}
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
                        <div className={styles.avatar}>
                          {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="Avatar" /> : getUserInitial()}
                        </div>
                        <button className={styles.editAvatarBtn}>✏️</button>
                        <span className={styles.avatarLabel}>Ảnh đại diện</span>
                      </div>
                      
                      <div className={styles.formFields}>
                        <div className={styles.formRow}>
                          <div className={styles.formGroup}>
                            <label>Họ và tên</label>
                            <input 
                              type="text" 
                              value={profile?.fullName || ''} 
                              onChange={(e) => setProfile(prev => prev ? {...prev, fullName: e.target.value} : null)}
                              className={styles.input} 
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Vai trò</label>
                            <input type="text" value={profile?.role || ''} className={styles.input} disabled style={{opacity: 0.6}} />
                          </div>
                        </div>
                        
                        <div className={styles.formGroup}>
                          <label>Địa chỉ Email</label>
                          <input type="email" value={profile?.email || ''} className={styles.input} disabled style={{opacity: 0.6}} />
                        </div>
                        
                        <div className={styles.formGroup}>
                          <label>Số điện thoại</label>
                          <input 
                            type="text" 
                            value={profile?.phoneNumber || ''}
                            onChange={(e) => setProfile(prev => prev ? {...prev, phoneNumber: e.target.value} : null)}
                            className={styles.input} 
                            placeholder="Nhập số điện thoại"
                          />
                        </div>

                        <div style={{marginTop: '1rem'}}>
                          <Button variant="primary" onClick={handleProfileUpdate}>Lưu hồ sơ</Button>
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

              {activeTab === 'ai' && (
                <section className={styles.section}>
                  <h2>Cấu hình AI Tutor</h2>
                  <form onSubmit={handleAISettingsUpdate}>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Ngôn ngữ phản hồi</label>
                        <select
                          className={styles.input}
                          value={aiSettings.language}
                          onChange={(e) =>
                            setAISettings((prev) => ({
                              ...prev,
                              language: e.target.value as AISettings['language'],
                            }))
                          }
                        >
                          <option value="VI">Tiếng Việt</option>
                          <option value="EN">English</option>
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Độ dài phản hồi</label>
                        <select
                          className={styles.input}
                          value={aiSettings.responseLength}
                          onChange={(e) =>
                            setAISettings((prev) => ({
                              ...prev,
                              responseLength: e.target.value as AISettings['responseLength'],
                            }))
                          }
                        >
                          <option value="SHORT">Ngắn</option>
                          <option value="MEDIUM">Vừa</option>
                          <option value="LONG">Dài</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Phong cách giao tiếp</label>
                      <select
                        className={styles.input}
                        value={aiSettings.communicationStyle}
                        onChange={(e) =>
                          setAISettings((prev) => ({
                            ...prev,
                            communicationStyle: e.target.value as AISettings['communicationStyle'],
                          }))
                        }
                      >
                        <option value="FRIENDLY">Friendly</option>
                        <option value="PROFESSIONAL">Professional</option>
                      </select>
                    </div>

                    <Button variant="primary" type="submit" disabled={savingAISettings}>
                      {savingAISettings ? 'Đang lưu...' : 'Lưu cấu hình AI'}
                    </Button>
                  </form>
                </section>
              )}

              {activeTab === 'security' && (
                <section className={styles.section}>
                  <h2>Bảo mật</h2>
                  <form onSubmit={handlePasswordUpdate}>
                    {(authInfo?.hasPassword) && (
                      <div className={styles.formGroup}>
                        <label>Mật khẩu hiện tại</label>
                        <input 
                          type="password" 
                          placeholder="••••••••" 
                          className={styles.input} 
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({...prev, currentPassword: e.target.value}))}
                          required
                        />
                      </div>
                    )}
                    {!authInfo?.hasPassword && authInfo?.isGoogleUser && (
                      <p style={{color: '#666', marginBottom: '1rem', fontSize: '0.9rem'}}>
                        Bạn đang đăng nhập bằng Google và chưa thiết lập mật khẩu. Bạn có thể tạo mật khẩu ở đây để đăng nhập bằng Email/Password sau này.
                      </p>
                    )}
                    <div className={styles.formGroup}>
                      <label>Mật khẩu mới</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        className={styles.input} 
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({...prev, newPassword: e.target.value}))}
                        required
                        minLength={8}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Xác nhận mật khẩu mới</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        className={styles.input}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({...prev, confirmPassword: e.target.value}))}
                        required
                        minLength={8}
                      />
                    </div>
                    
                    <div style={{marginTop: '1.5rem'}}>
                      <Button variant="primary" type="submit">Cập nhật mật khẩu</Button>
                    </div>
                  </form>
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
              <div className={styles.actions} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                {globalMessage.text ? (
                  <span style={{color: globalMessage.type === 'error' ? 'red' : 'green', fontSize: '0.9rem', fontWeight: 500}}>
                    {globalMessage.text}
                  </span>
                ) : <span />}
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
