'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import Button from '@/components/ui/Button';
import { getProfile, updateProfile, changePassword } from '@/services/user';
import { ApiException } from '@/services/api';
import { getCurrentUser, AuthResponse } from '@/services/auth';

export default function ProfilePage() {
  const router = useRouter();

  // Auth Info for password checking
  const [authInfo, setAuthInfo] = useState<AuthResponse | null>(null);

  // Profile state
  const [profile, setProfile] = useState<{
    email: string;
    fullName: string;
    phoneNumber: string | null;
    avatarUrl: string | null;
    role: string;
    createdAt: string;
  }>({
    email: '',
    fullName: '',
    phoneNumber: '',
    avatarUrl: '',
    role: '',
    createdAt: '',
  });

  // Edit form
  const [editForm, setEditForm] = useState({ fullName: '', phoneNumber: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editSuccess, setEditSuccess] = useState('');

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const [profData, authData] = await Promise.all([
        getProfile(),
        getCurrentUser()
      ]);
      setProfile(profData);
      setAuthInfo(authData);
      setEditForm({ fullName: profData.fullName, phoneNumber: profData.phoneNumber || '' });
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const getInitial = () => {
    return profile.fullName ? profile.fullName.charAt(0).toUpperCase() : '?';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      STUDENT: 'Sinh viên',
      TEACHER: 'Giảng viên',
      ADMIN: 'Quản trị viên',
    };
    return labels[role] || role;
  };

  // Edit profile handlers
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setEditForm(prev => ({ ...prev, [id]: value }));
    if (editErrors[id]) {
      setEditErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
    setEditSuccess('');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditErrors({});
    setEditSuccess('');
    setSaving(true);

    try {
      const updated = await updateProfile(editForm);
      setProfile(updated);
      setIsEditing(false);
      setEditSuccess('Cập nhật thông tin thành công!');

      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify({
          email: updated.email,
          fullName: updated.fullName,
          role: updated.role,
        }));
      }
    } catch (err) {
      if (err instanceof ApiException) {
        err.fieldErrors ? setEditErrors(err.fieldErrors) : setEditErrors({ global: err.message });
      } else {
        setEditErrors({ global: 'Đã xảy ra lỗi. Vui lòng thử lại.' });
      }
    } finally {
      setSaving(false);
    }
  };

  // Password handlers
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [id]: value }));
    if (passwordErrors[id]) {
      setPasswordErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
    setPasswordSuccess('');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrors({ confirmPassword: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    setChangingPassword(true);

    try {
      const result = await changePassword({
        currentPassword: authInfo?.hasPassword ? passwordForm.currentPassword : '',
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      
      setPasswordSuccess(result.message);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // Refresh auth info to update hasPassword status
      const updatedAuth = await getCurrentUser();
      setAuthInfo(updatedAuth);
    } catch (err) {
      if (err instanceof ApiException) {
        err.fieldErrors ? setPasswordErrors(err.fieldErrors) : setPasswordErrors({ global: err.message });
      } else {
        setPasswordErrors({ global: 'Đã xảy ra lỗi. Vui lòng thử lại.' });
      }
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Đang tải...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <Link href="/dashboard" className={styles.backLink}>← Quay lại Dashboard</Link>
          <h1>Hồ sơ cá nhân</h1>
          <p>Quản lý thông tin tài khoản của bạn</p>
        </div>

        {/* Section 1: Avatar + Display Info */}
        <section className={styles.section}>
          <div className={styles.profileHeader}>
            <div className={styles.avatar}>
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.fullName} />
              ) : (
                <span>{getInitial()}</span>
              )}
            </div>
            <div className={styles.profileMeta}>
              <h2>{profile.fullName}</h2>
              <p className={styles.roleBadge}>{getRoleLabel(profile.role)}</p>
              <p className={styles.email}>{profile.email}</p>
            </div>
          </div>
        </section>

        {/* Section 2: Edit Profile */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>Thông tin cá nhân</h3>
            {!isEditing && (
              <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                ✏️ Chỉnh sửa
              </button>
            )}
          </div>

          {editSuccess && <div className={styles.successAlert}>{editSuccess}</div>}
          {editErrors.global && <div className={styles.errorAlert}>{editErrors.global}</div>}

          {isEditing ? (
            <form className={styles.form} onSubmit={handleSaveProfile}>
              <div className={styles.inputGroup}>
                <label htmlFor="fullName">Họ và tên</label>
                <input
                  type="text"
                  id="fullName"
                  className={`${styles.input} ${editErrors.fullName ? styles.inputError : ''}`}
                  value={editForm.fullName}
                  onChange={handleEditChange}
                />
                {editErrors.fullName && <span className={styles.fieldError}>{editErrors.fullName}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="phoneNumber">Số điện thoại</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  placeholder="Chưa cập nhật"
                  className={`${styles.input} ${editErrors.phoneNumber ? styles.inputError : ''}`}
                  value={editForm.phoneNumber}
                  onChange={handleEditChange}
                />
                {editErrors.phoneNumber && <span className={styles.fieldError}>{editErrors.phoneNumber}</span>}
              </div>

              <div className={styles.formActions}>
                <Button variant="primary" type="submit" disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
                <button type="button" className={styles.cancelBtn} onClick={() => {
                  setIsEditing(false);
                  setEditForm({ fullName: profile.fullName, phoneNumber: profile.phoneNumber || '' });
                  setEditErrors({});
                }}>
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Họ và tên</span>
                <span className={styles.infoValue}>{profile.fullName}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Số điện thoại</span>
                <span className={styles.infoValue}>
                  {profile.phoneNumber || <em className={styles.notSet}>Chưa cập nhật</em>}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{profile.email}</span>
              </div>
            </div>
          )}
        </section>

        {/* Section 3: Change Password */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>Đổi mật khẩu</h3>
          </div>

          {passwordSuccess && <div className={styles.successAlert}>{passwordSuccess}</div>}
          {passwordErrors.global && <div className={styles.errorAlert}>{passwordErrors.global}</div>}

          <form className={styles.form} onSubmit={handleChangePassword}>
            {authInfo?.hasPassword ? (
              <div className={styles.inputGroup}>
                <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  id="currentPassword"
                  placeholder="••••••••"
                  className={`${styles.input} ${passwordErrors.currentPassword ? styles.inputError : ''}`}
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
                {passwordErrors.currentPassword && <span className={styles.fieldError}>{passwordErrors.currentPassword}</span>}
              </div>
            ) : authInfo?.isGoogleUser && (
              <p className={styles.infoText}>
                Bạn đang đăng nhập bằng Google và chưa thiết lập mật khẩu. Bạn có thể tạo mật khẩu ở đây để đăng nhập bằng Email sau này.
              </p>
            )}

            <div className={styles.inputGroup}>
              <label htmlFor="newPassword">Mật khẩu mới</label>
              <input
                type="password"
                id="newPassword"
                placeholder="Tối thiểu 8 ký tự"
                className={`${styles.input} ${passwordErrors.newPassword ? styles.inputError : ''}`}
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={8}
              />
              {passwordErrors.newPassword && <span className={styles.fieldError}>{passwordErrors.newPassword}</span>}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="••••••••"
                className={`${styles.input} ${passwordErrors.confirmPassword ? styles.inputError : ''}`}
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                required
                minLength={8}
              />
              {passwordErrors.confirmPassword && <span className={styles.fieldError}>{passwordErrors.confirmPassword}</span>}
            </div>

            <div className={styles.formActions}>
              <Button variant="primary" type="submit" disabled={changingPassword}>
                {changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
              </Button>
            </div>
          </form>
        </section>

        {/* Section 4: Account Info (read-only) */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>Thông tin tài khoản</h3>
          </div>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Email</span>
              <span className={styles.infoValue}>{profile.email}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Vai trò</span>
              <span className={styles.infoValue}>{getRoleLabel(profile.role)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Ngày tham gia</span>
              <span className={styles.infoValue}>{formatDate(profile.createdAt)}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
