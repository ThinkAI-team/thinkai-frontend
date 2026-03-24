'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import PageState from '@/components/ui/PageState';
import dashboardStyles from '../dashboard/page.module.css';
import MainSidebar from '../components/MainSidebar';
import styles from './page.module.css';
import { getCurrentUser, type AuthResponse, updatePassword } from '@/services/auth';
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

type SettingsTab = 'profile' | 'ai' | 'notifications' | 'security' | 'subscription';
type MessageType = 'success' | 'error' | '';

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: 'profile', label: 'Hồ sơ' },
  { id: 'ai', label: 'AI Tutor' },
  { id: 'notifications', label: 'Thông báo' },
  { id: 'security', label: 'Bảo mật' },
  { id: 'subscription', label: 'Gói đăng ký' },
];

const defaultAISettings: AISettings = {
  language: 'VI',
  responseLength: 'MEDIUM',
  communicationStyle: 'FRIENDLY',
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [darkMode, setDarkMode] = useState(true);

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [authInfo, setAuthInfo] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [globalMessage, setGlobalMessage] = useState<{ text: string; type: MessageType }>({
    text: '',
    type: '',
  });
  const [aiSettings, setAISettings] = useState<AISettings>(defaultAISettings);
  const [savingAISettings, setSavingAISettings] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const applyTheme = useCallback((theme: 'light' | 'dark') => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = theme;
      document.cookie = `theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', theme);
    }
    setDarkMode(theme === 'dark');
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      if (typeof window !== 'undefined') {
        const htmlTheme = document.documentElement.dataset.theme;
        const storedTheme = window.localStorage.getItem('theme');
        const theme =
          htmlTheme === 'light' || htmlTheme === 'dark'
            ? htmlTheme
            : storedTheme === 'light' || storedTheme === 'dark'
              ? storedTheme
              : 'dark';
        document.documentElement.dataset.theme = theme;
        document.cookie = `theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
        window.localStorage.setItem('theme', theme);
        setDarkMode(theme === 'dark');
      }
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
      setLoadError('Không thể tải dữ liệu cài đặt.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalMessage({ text: '', type: '' });
    try {
      if (!profile) return;
      const updated = await updateProfile({
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber || undefined,
      });
      setProfile(updated);
      setGlobalMessage({ text: 'Cập nhật hồ sơ thành công', type: 'success' });
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
    return (
      <div className={dashboardStyles.container}>
        <MainSidebar active="settings" />
        <main className={`${dashboardStyles.main} ${styles.main}`}>
          <PageState
            type="loading"
            title="Đang tải cài đặt"
            message="Hệ thống đang đồng bộ hồ sơ, bảo mật và cấu hình AI Tutor."
          />
        </main>
      </div>
    );
  }

  if (loadError && !profile && !authInfo) {
    return (
      <div className={dashboardStyles.container}>
        <MainSidebar active="settings" />
        <main className={`${dashboardStyles.main} ${styles.main}`}>
          <PageState
            type="error"
            message={loadError}
            actionLabel="Thử lại"
            onAction={fetchData}
          />
        </main>
      </div>
    );
  }

  return (
    <div className={dashboardStyles.container}>
      <MainSidebar active="settings" />

      <main className={`${dashboardStyles.main} ${styles.main}`}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h1>Cài đặt</h1>
            <p>Quản lý thông tin cá nhân và tùy chọn trải nghiệm.</p>
          </header>

          {globalMessage.text && (
            <p
              className={`${styles.globalMessage} ${
                globalMessage.type === 'error' ? styles.globalError : styles.globalSuccess
              }`}
            >
              {globalMessage.text}
            </p>
          )}

          <div className={styles.content}>
            <aside className={styles.sidebar} role="tablist" aria-label="Cài đặt tài khoản">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  id={`settings-tab-${tab.id}`}
                  variant="secondary"
                  size="sm"
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`settings-panel-${tab.id}`}
                  className={`${styles.tabBtn} ${activeTab === tab.id ? styles.active : ''}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setGlobalMessage({ text: '', type: '' });
                  }}
                >
                  <span>{tab.label}</span>
                </Button>
              ))}
            </aside>

            <div className={styles.mainContent}>
              {activeTab === 'profile' && (
                <div
                  id="settings-panel-profile"
                  role="tabpanel"
                  aria-labelledby="settings-tab-profile"
                >
                  <section className={styles.section}>
                    <div className={styles.profileSection}>
                      <div className={styles.avatarSection}>
                        <div className={styles.avatar}>
                          {profile?.avatarUrl ? (
                            <Image
                              src={profile.avatarUrl}
                              alt="Avatar"
                              width={86}
                              height={86}
                              unoptimized
                            />
                          ) : (
                            getUserInitial()
                          )}
                        </div>
                        <Button variant="secondary" size="sm" type="button" className={styles.editAvatarBtn}>
                          Sửa
                        </Button>
                        <span className={styles.avatarLabel}>Ảnh đại diện</span>
                      </div>

                      <form className={styles.formFields} onSubmit={handleProfileUpdate}>
                        <div className={styles.formRow}>
                          <div className={styles.formGroup}>
                            <label>Họ và tên</label>
                            <input
                              type="text"
                              value={profile?.fullName || ''}
                              onChange={(e) =>
                                setProfile((prev) => (prev ? { ...prev, fullName: e.target.value } : null))
                              }
                              className={styles.input}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Vai trò</label>
                            <input
                              type="text"
                              value={profile?.role || ''}
                              className={`${styles.input} ${styles.disabledInput}`}
                              disabled
                            />
                          </div>
                        </div>

                        <div className={styles.formGroup}>
                          <label>Địa chỉ Email</label>
                          <input
                            type="email"
                            value={profile?.email || ''}
                            className={`${styles.input} ${styles.disabledInput}`}
                            disabled
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label>Số điện thoại</label>
                          <input
                            type="text"
                            value={profile?.phoneNumber || ''}
                            onChange={(e) =>
                              setProfile((prev) => (prev ? { ...prev, phoneNumber: e.target.value } : null))
                            }
                            className={styles.input}
                            placeholder="Nhập số điện thoại"
                          />
                        </div>

                        <div className={styles.formAction}>
                          <Button variant="primary" type="submit">Lưu hồ sơ</Button>
                        </div>
                      </form>
                    </div>
                  </section>

                  <section className={styles.section}>
                    <h2>Giao diện</h2>
                    <div className={styles.toggleRow}>
                      <div className={styles.toggleInfo}>
                        <div>
                          <span className={styles.toggleLabel}>Chế độ tối</span>
                          <span className={styles.toggleDesc}>Giảm mỏi mắt và tăng sự tập trung</span>
                        </div>
                      </div>
                      <label className={styles.toggle}>
                        <input
                          type="checkbox"
                          checked={darkMode}
                          onChange={(e) => applyTheme(e.target.checked ? 'dark' : 'light')}
                        />
                        <span className={styles.slider} />
                      </label>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div
                  id="settings-panel-notifications"
                  role="tabpanel"
                  aria-labelledby="settings-tab-notifications"
                >
                  <section className={styles.section}>
                    <h2>Thông báo</h2>
                    <div className={styles.toggleRow}>
                      <div className={styles.toggleInfo}>
                        <div>
                          <span className={styles.toggleLabel}>Email thông báo</span>
                          <span className={styles.toggleDesc}>Nhận thông báo qua email</span>
                        </div>
                      </div>
                      <label className={styles.toggle}>
                        <input type="checkbox" defaultChecked />
                        <span className={styles.slider} />
                      </label>
                    </div>
                    <div className={styles.toggleRow}>
                      <div className={styles.toggleInfo}>
                        <div>
                          <span className={styles.toggleLabel}>Push notifications</span>
                          <span className={styles.toggleDesc}>Nhận thông báo trên trình duyệt</span>
                        </div>
                      </div>
                      <label className={styles.toggle}>
                        <input type="checkbox" />
                        <span className={styles.slider} />
                      </label>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'ai' && (
                <div id="settings-panel-ai" role="tabpanel" aria-labelledby="settings-tab-ai">
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
                </div>
              )}

              {activeTab === 'security' && (
                <div
                  id="settings-panel-security"
                  role="tabpanel"
                  aria-labelledby="settings-tab-security"
                >
                  <section className={styles.section}>
                    <h2>Bảo mật</h2>
                    <form onSubmit={handlePasswordUpdate}>
                      {authInfo?.hasPassword && (
                        <div className={styles.formGroup}>
                          <label>Mật khẩu hiện tại</label>
                          <input
                            type="password"
                            placeholder="••••••••"
                            className={styles.input}
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                            }
                            required
                          />
                        </div>
                      )}
                      {!authInfo?.hasPassword && authInfo?.isGoogleUser && (
                        <p className={styles.helperText}>
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
                          onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
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
                          onChange={(e) =>
                            setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                          }
                          required
                          minLength={8}
                        />
                      </div>

                      <div className={styles.formAction}>
                        <Button variant="primary" type="submit">Cập nhật mật khẩu</Button>
                      </div>
                    </form>
                  </section>
                </div>
              )}

              {activeTab === 'subscription' && (
                <div
                  id="settings-panel-subscription"
                  role="tabpanel"
                  aria-labelledby="settings-tab-subscription"
                >
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
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
