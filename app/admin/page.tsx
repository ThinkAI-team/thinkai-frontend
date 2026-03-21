'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import {
  createAdminCourse,
  deleteAdminCourse,
  getAdminCourses,
  getAdminDashboard,
  getAdminUsers,
  updateAdminCourse,
  updateAdminUserStatus,
  updateAIPrompts,
  type AdminCourse,
  type AdminCourseRequest,
  type AdminDashboardStats,
  type AdminUser,
} from '@/services/admin';

type TabId = 'overview' | 'users' | 'courses' | 'prompts';

const sidebarItems: Array<{ id: TabId; icon: string; label: string }> = [
  { id: 'overview', icon: '📊', label: 'Tổng quan' },
  { id: 'users', icon: '👥', label: 'Người dùng' },
  { id: 'courses', icon: '📚', label: 'Khóa học' },
  { id: 'prompts', icon: '🤖', label: 'AI Prompts' },
];

const defaultCourseForm: AdminCourseRequest = {
  title: '',
  description: '',
  price: 0,
  instructorId: 0,
  thumbnailUrl: '',
};

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [courseForm, setCourseForm] = useState<AdminCourseRequest>(defaultCourseForm);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [savingCourse, setSavingCourse] = useState(false);
  const [aiPromptForm, setAIPromptForm] = useState({
    tutorSystemPrompt: '',
    examGeneratorPrompt: '',
  });
  const [savingPrompts, setSavingPrompts] = useState(false);

  const fetchOverview = useCallback(async () => {
    const dashboardData = await getAdminDashboard();
    setStats(dashboardData);
  }, []);

  const fetchUsers = useCallback(async () => {
    const usersData = await getAdminUsers({ page: 0, size: 20 });
    setUsers(usersData.content);
  }, []);

  const fetchCourses = useCallback(async () => {
    const coursesData = await getAdminCourses({ page: 0, size: 20 });
    setCourses(coursesData.content);
  }, []);

  const fetchTabData = useCallback(async (tab: TabId) => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'overview') await fetchOverview();
      if (tab === 'users') await fetchUsers();
      if (tab === 'courses') await fetchCourses();
      if (tab === 'prompts') {
        // API docs chỉ có PUT, nên giữ form rỗng để admin chủ động nhập mới.
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu admin.');
    } finally {
      setLoading(false);
    }
  }, [fetchCourses, fetchOverview, fetchUsers]);

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab, fetchTabData]);

  const handleToggleUserStatus = async (user: AdminUser) => {
    try {
      await updateAdminUserStatus(user.id, !user.isActive);
      setUsers((prev) =>
        prev.map((item) => (item.id === user.id ? { ...item, isActive: !item.isActive } : item))
      );
      setNotice('Đã cập nhật trạng thái tài khoản.');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật trạng thái user.');
    }
  };

  const resetCourseForm = () => {
    setCourseForm(defaultCourseForm);
    setEditingCourseId(null);
  };

  const handleCourseSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!courseForm.title.trim()) {
      setError('Vui lòng nhập tiêu đề khóa học.');
      return;
    }
    if (courseForm.instructorId <= 0) {
      setError('Vui lòng nhập instructorId hợp lệ.');
      return;
    }

    setSavingCourse(true);
    setError('');
    setNotice('');
    try {
      if (editingCourseId) {
        await updateAdminCourse(editingCourseId, courseForm);
        setNotice('Đã cập nhật khóa học.');
      } else {
        await createAdminCourse(courseForm);
        setNotice('Đã tạo khóa học mới.');
      }
      resetCourseForm();
      await fetchCourses();
    } catch (err: any) {
      setError(err.message || 'Không thể lưu khóa học.');
    } finally {
      setSavingCourse(false);
    }
  };

  const handleEditCourse = (course: AdminCourse) => {
    setEditingCourseId(course.id);
    setCourseForm({
      title: course.title || '',
      description: course.description || '',
      price: course.price || 0,
      instructorId: course.instructorId || 0,
      thumbnailUrl: course.thumbnailUrl || '',
    });
  };

  const handleDeleteCourse = async (courseId: number) => {
    try {
      await deleteAdminCourse(courseId);
      setCourses((prev) => prev.filter((item) => item.id !== courseId));
      setNotice('Đã xóa khóa học.');
      if (editingCourseId === courseId) resetCourseForm();
    } catch (err: any) {
      setError(err.message || 'Không thể xóa khóa học.');
    }
  };

  const handleSavePrompts = async (e: FormEvent) => {
    e.preventDefault();
    if (!aiPromptForm.tutorSystemPrompt.trim() || !aiPromptForm.examGeneratorPrompt.trim()) {
      setError('Vui lòng nhập đầy đủ tutorSystemPrompt và examGeneratorPrompt.');
      return;
    }

    setSavingPrompts(true);
    setError('');
    setNotice('');
    try {
      await updateAIPrompts(aiPromptForm);
      setNotice('Đã cập nhật AI prompts.');
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật AI prompts.');
    } finally {
      setSavingPrompts(false);
    }
  };

  const statsData = [
    { icon: '👥', value: stats?.totalUsers || 0, label: 'Tổng người dùng' },
    { icon: '📚', value: stats?.totalCourses || 0, label: 'Tổng khóa học' },
    { icon: '🧾', value: stats?.totalEnrollments || 0, label: 'Tổng lượt đăng ký' },
    { icon: '🤖', value: stats?.aiChatsToday || 0, label: 'AI chats hôm nay' },
  ];

  return (
    <div className={styles.container}>
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
              onClick={() => {
                setActiveTab(item.id);
                setError('');
                setNotice('');
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.themeBtn} onClick={() => fetchTabData(activeTab)}>
            🔄 Làm mới dữ liệu
          </button>
          <div className={styles.adminInfo}>
            <div className={styles.adminAvatar}>👤</div>
            <div>
              <span className={styles.adminName}>Quản trị viên</span>
              <span className={styles.adminEmail}>admin@thinkai.vn</span>
            </div>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1>Bảng điều khiển Admin</h1>
            <p>Tích hợp API docs: dashboard, users, courses và AI prompts.</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.downloadBtn} onClick={() => fetchTabData(activeTab)}>
              Cập nhật
            </button>
          </div>
        </header>

        {error && <p style={{ color: '#b91c1c', marginBottom: '10px' }}>{error}</p>}
        {notice && <p style={{ color: '#166534', marginBottom: '10px' }}>{notice}</p>}
        {loading && <p>Đang tải dữ liệu...</p>}

        {!loading && activeTab === 'overview' && (
          <div className={styles.statsGrid}>
            {statsData.map((stat) => (
              <div key={stat.label} className={styles.statCard}>
                <div className={styles.statIcon}>{stat.icon}</div>
                <div className={styles.statContent}>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span className={styles.statLabel}>{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && activeTab === 'users' && (
          <section className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h3>Quản lý người dùng</h3>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>TÊN NGƯỜI DÙNG</th>
                  <th>EMAIL</th>
                  <th>VAI TRÒ</th>
                  <th>TRẠNG THÁI</th>
                  <th>HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.userAvatar}>{user.fullName.charAt(0)}</div>
                        <span>{user.fullName}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <span className={`${styles.status} ${user.isActive ? styles.active : styles.offline}`}>
                        {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td>
                      <button className={styles.actionBtn} onClick={() => handleToggleUserStatus(user)}>
                        {user.isActive ? 'Khóa' : 'Mở'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {!loading && activeTab === 'courses' && (
          <>
            <section className={styles.tableSection} style={{ marginBottom: '18px' }}>
              <div className={styles.tableHeader}>
                <h3>{editingCourseId ? `Cập nhật khóa học #${editingCourseId}` : 'Tạo khóa học mới'}</h3>
              </div>

              <form onSubmit={handleCourseSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <input
                    className={styles.searchBar}
                    style={{ padding: '10px 12px' }}
                    placeholder="Tiêu đề"
                    value={courseForm.title}
                    onChange={(e) => setCourseForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                  <input
                    className={styles.searchBar}
                    style={{ padding: '10px 12px' }}
                    type="number"
                    placeholder="instructorId"
                    value={courseForm.instructorId || ''}
                    onChange={(e) =>
                      setCourseForm((prev) => ({ ...prev, instructorId: Number(e.target.value) || 0 }))
                    }
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 170px', gap: '10px', marginBottom: '10px' }}>
                  <input
                    className={styles.searchBar}
                    style={{ padding: '10px 12px' }}
                    placeholder="Thumbnail URL (tùy chọn)"
                    value={courseForm.thumbnailUrl || ''}
                    onChange={(e) => setCourseForm((prev) => ({ ...prev, thumbnailUrl: e.target.value }))}
                  />
                  <input
                    className={styles.searchBar}
                    style={{ padding: '10px 12px' }}
                    type="number"
                    placeholder="Giá (VND)"
                    value={courseForm.price || 0}
                    onChange={(e) => setCourseForm((prev) => ({ ...prev, price: Number(e.target.value) || 0 }))}
                  />
                </div>

                <textarea
                  className={styles.searchBar}
                  style={{ width: '100%', minHeight: '90px', padding: '10px 12px', marginBottom: '10px' }}
                  placeholder="Mô tả khóa học"
                  value={courseForm.description}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, description: e.target.value }))}
                />

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className={styles.downloadBtn} type="submit" disabled={savingCourse}>
                    {savingCourse ? 'Đang lưu...' : editingCourseId ? 'Cập nhật khóa học' : 'Tạo khóa học'}
                  </button>
                  {editingCourseId && (
                    <button className={styles.tableActionBtn} type="button" onClick={resetCourseForm}>
                      Hủy chỉnh sửa
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section className={styles.tableSection}>
              <div className={styles.tableHeader}>
                <h3>Danh sách khóa học</h3>
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>TÊN KHÓA HỌC</th>
                    <th>GIÁ</th>
                    <th>TRẠNG THÁI</th>
                    <th>HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td>{course.id}</td>
                      <td>{course.title}</td>
                      <td>{(course.price || 0).toLocaleString('vi-VN')}đ</td>
                      <td>{course.status || (course.isPublished ? 'PUBLISHED' : 'DRAFT')}</td>
                      <td style={{ display: 'flex', gap: '6px' }}>
                        <button className={styles.tableActionBtn} onClick={() => handleEditCourse(course)}>
                          Sửa
                        </button>
                        <button className={styles.tableActionBtn} onClick={() => handleDeleteCourse(course.id)}>
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}

        {!loading && activeTab === 'prompts' && (
          <section className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h3>Cấu hình AI Prompts</h3>
            </div>
            <form onSubmit={handleSavePrompts}>
              <textarea
                className={styles.searchBar}
                style={{ width: '100%', minHeight: '120px', padding: '10px 12px', marginBottom: '10px' }}
                placeholder="tutorSystemPrompt"
                value={aiPromptForm.tutorSystemPrompt}
                onChange={(e) =>
                  setAIPromptForm((prev) => ({ ...prev, tutorSystemPrompt: e.target.value }))
                }
              />
              <textarea
                className={styles.searchBar}
                style={{ width: '100%', minHeight: '120px', padding: '10px 12px', marginBottom: '10px' }}
                placeholder="examGeneratorPrompt"
                value={aiPromptForm.examGeneratorPrompt}
                onChange={(e) =>
                  setAIPromptForm((prev) => ({ ...prev, examGeneratorPrompt: e.target.value }))
                }
              />
              <button className={styles.downloadBtn} type="submit" disabled={savingPrompts}>
                {savingPrompts ? 'Đang lưu...' : 'Lưu AI prompts'}
              </button>
            </form>
          </section>
        )}

        <footer className={styles.footer}>
          <p>© 2026 ThinkAI Admin Panel.</p>
        </footer>
      </main>
    </div>
  );
}
