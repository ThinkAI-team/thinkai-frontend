'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import PageState from '@/components/ui/PageState';
import Button from '@/components/ui/Button';
import { formatVnd } from '@/lib/utils/format';
import {
  blockAdminCourse,
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
  getAiTraces,
  getAiStats,
  type AiTraceMetric,
  getAdminAiRuntimeSettings,
  getAdminAuditLogs,
  updateAdminAiRuntimeSettings,
  type AdminAuditLog,
  type AdminAiRuntimeSettings,
} from '@/services/admin';

type TabId = 'overview' | 'users' | 'courses' | 'prompts' | 'ai-traces' | 'ai-runtime' | 'audit-logs';

const sidebarItems: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'users', label: 'Người dùng' },
  { id: 'courses', label: 'Khóa học' },
  { id: 'ai-traces', label: 'AI Traces' },
  { id: 'ai-runtime', label: 'AI Runtime' },
  { id: 'audit-logs', label: 'Audit Logs' },
  { id: 'prompts', label: 'AI Prompts' },
];

const defaultCourseForm: AdminCourseRequest = {
  title: '',
  description: '',
  price: 0,
  instructorId: 0,
  thumbnailUrl: '',
  isPublished: false,
  status: 'DRAFT',
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
  const [aiTraces, setAiTraces] = useState<AiTraceMetric[]>([]);
  const [aiStats, setAiStats] = useState<{
    totalTraces: number;
    avgLatencyMs: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    agentUsage: Record<string, number>;
  } | null>(null);
  const [aiRuntimeForm, setAiRuntimeForm] = useState<AdminAiRuntimeSettings>({
    tutorEnabled: true,
    harnessEnabled: true,
    tutorModel: '',
    tutorFallbackModel: '',
    harnessModels: [],
    blockedModels: [],
  });
  const [savingAiRuntime, setSavingAiRuntime] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

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
      if (tab === 'ai-traces') {
        const [tracesData, statsData] = await Promise.all([
          getAiTraces(),
          getAiStats(),
        ]);
        setAiTraces(tracesData);
        setAiStats(statsData);
      }
      if (tab === 'ai-runtime') {
        const runtimeSettings = await getAdminAiRuntimeSettings();
        setAiRuntimeForm({
          tutorEnabled: runtimeSettings.tutorEnabled,
          harnessEnabled: runtimeSettings.harnessEnabled,
          tutorModel: runtimeSettings.tutorModel || '',
          tutorFallbackModel: runtimeSettings.tutorFallbackModel || '',
          harnessModels: runtimeSettings.harnessModels || [],
          blockedModels: runtimeSettings.blockedModels || [],
        });
      }
      if (tab === 'audit-logs') {
        const logsData = await getAdminAuditLogs({ page: 0, size: 50 });
        setAuditLogs(logsData.content || []);
      }
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
      isPublished: course.isPublished ?? false,
      status: course.status || 'DRAFT',
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

  const handleToggleBlockCourse = async (course: AdminCourse) => {
    try {
      const currentlyBlocked = course.status === 'BLOCKED';
      const result = await blockAdminCourse(
        course.id,
        !currentlyBlocked,
        currentlyBlocked ? 'PENDING' : undefined
      );
      setCourses((prev) =>
        prev.map((item) =>
          item.id === course.id
            ? { ...item, status: result.status as AdminCourse['status'], isPublished: result.isPublished }
            : item
        )
      );
      setNotice(currentlyBlocked ? 'Đã mở khóa khóa học.' : 'Đã khóa khóa học.');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật trạng thái block khóa học.');
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

  const parseModelText = (raw: string): string[] =>
    raw
      .split(/\r?\n|,/g)
      .map((item) => item.trim())
      .filter(Boolean);

  const handleSaveAiRuntime = async (e: FormEvent) => {
    e.preventDefault();
    setSavingAiRuntime(true);
    setError('');
    setNotice('');
    try {
      const payload: AdminAiRuntimeSettings = {
        tutorEnabled: aiRuntimeForm.tutorEnabled,
        harnessEnabled: aiRuntimeForm.harnessEnabled,
        tutorModel: aiRuntimeForm.tutorModel?.trim() || null,
        tutorFallbackModel: aiRuntimeForm.tutorFallbackModel?.trim() || null,
        harnessModels: parseModelText((aiRuntimeForm.harnessModels || []).join('\n')),
        blockedModels: parseModelText((aiRuntimeForm.blockedModels || []).join('\n')),
      };
      const updated = await updateAdminAiRuntimeSettings(payload);
      setAiRuntimeForm({
        tutorEnabled: updated.tutorEnabled,
        harnessEnabled: updated.harnessEnabled,
        tutorModel: updated.tutorModel || '',
        tutorFallbackModel: updated.tutorFallbackModel || '',
        harnessModels: updated.harnessModels || [],
        blockedModels: updated.blockedModels || [],
      });
      setNotice('Đã cập nhật AI runtime settings.');
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật AI runtime settings.');
    } finally {
      setSavingAiRuntime(false);
    }
  };

  const statsData = [
    { value: stats?.totalUsers || 0, label: 'Tổng người dùng' },
    { value: stats?.totalCourses || 0, label: 'Tổng khóa học' },
    { value: stats?.totalEnrollments || 0, label: 'Tổng lượt đăng ký' },
    { value: stats?.aiChatsToday || 0, label: 'AI chats hôm nay' },
  ];

  const showFatalError =
    !loading &&
    !!error &&
    (
      (activeTab === 'overview' && !stats) ||
      (activeTab === 'users' && users.length === 0) ||
      (activeTab === 'courses' && courses.length === 0)
    );

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>ThinkAI</span>
        </Link>

        <nav className={styles.nav} role="tablist" aria-label="Bảng điều khiển admin">
          {sidebarItems.map((item) => (
            <Button
              key={item.id}
              id={`admin-tab-${item.id}`}
              variant="secondary"
              size="sm"
              type="button"
              role="tab"
              aria-selected={activeTab === item.id}
              aria-controls={`admin-panel-${item.id}`}
              className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                setError('');
                setNotice('');
              }}
            >
              <span>{item.label}</span>
            </Button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            className={styles.themeBtn}
            onClick={() => fetchTabData(activeTab)}
          >
            Làm mới dữ liệu
          </Button>
          <div className={styles.adminInfo}>
            <div className={styles.adminAvatar}>A</div>
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
            <Button
              variant="primary"
              size="sm"
              type="button"
              className={styles.downloadBtn}
              onClick={() => fetchTabData(activeTab)}
            >
              Cập nhật
            </Button>
          </div>
        </header>

        {!showFatalError && error && <p className={styles.errorBanner}>{error}</p>}
        {notice && <p className={styles.noticeBanner}>{notice}</p>}
        {loading && (
          <PageState type="loading" message={`Đang tải dữ liệu tab ${activeTab}...`} />
        )}
        {showFatalError && (
          <PageState
            type="error"
            message={error}
            actionLabel="Thử lại"
            onAction={() => fetchTabData(activeTab)}
          />
        )}

        {!loading && activeTab === 'overview' && (
          <div
            id="admin-panel-overview"
            role="tabpanel"
            aria-labelledby="admin-tab-overview"
            className={styles.statsGrid}
          >
            {statsData.map((stat) => (
              <div key={stat.label} className={styles.statCard}>
                <div className={styles.statContent}>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span className={styles.statLabel}>{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && activeTab === 'users' && (
          <section
            id="admin-panel-users"
            role="tabpanel"
            aria-labelledby="admin-tab-users"
            className={styles.tableSection}
          >
            <div className={styles.tableHeader}>
              <h3>Quản lý người dùng</h3>
            </div>
            {users.length === 0 ? (
              <PageState type="empty" message="Chưa có người dùng để hiển thị." />
            ) : (
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
                        <Button
                          variant="secondary"
                          size="sm"
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => handleToggleUserStatus(user)}
                        >
                          {user.isActive ? 'Khóa' : 'Mở'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {!loading && activeTab === 'courses' && (
          <div
            id="admin-panel-courses"
            role="tabpanel"
            aria-labelledby="admin-tab-courses"
          >
            <section className={`${styles.tableSection} ${styles.editorSection}`}>
              <div className={styles.tableHeader}>
                <h3>{editingCourseId ? `Cập nhật khóa học #${editingCourseId}` : 'Tạo khóa học mới'}</h3>
              </div>

              <form onSubmit={handleCourseSubmit}>
                <div className={styles.inputGridTwo}>
                  <input
                    className={`${styles.searchBar} ${styles.formInput}`}
                    placeholder="Tiêu đề"
                    value={courseForm.title}
                    onChange={(e) => setCourseForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                  <input
                    className={`${styles.searchBar} ${styles.formInput}`}
                    type="number"
                    placeholder="instructorId"
                    value={courseForm.instructorId || ''}
                    onChange={(e) =>
                      setCourseForm((prev) => ({ ...prev, instructorId: Number(e.target.value) || 0 }))
                    }
                  />
                </div>

                <div className={styles.inputGridPrice}>
                  <input
                    className={`${styles.searchBar} ${styles.formInput}`}
                    placeholder="Thumbnail URL (tùy chọn)"
                    value={courseForm.thumbnailUrl || ''}
                    onChange={(e) => setCourseForm((prev) => ({ ...prev, thumbnailUrl: e.target.value }))}
                  />
                  <input
                    className={`${styles.searchBar} ${styles.formInput}`}
                    type="number"
                    placeholder="Giá (VND)"
                    value={courseForm.price || 0}
                    onChange={(e) => setCourseForm((prev) => ({ ...prev, price: Number(e.target.value) || 0 }))}
                  />
                </div>

                <div className={styles.inputGridTwo}>
                  <select
                    className={`${styles.searchBar} ${styles.formInput}`}
                    value={courseForm.status || 'DRAFT'}
                    onChange={(e) =>
                      setCourseForm((prev) => ({
                        ...prev,
                        status: e.target.value as 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED',
                      }))
                    }
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                  <label className={styles.radioLabel}>
                    <input
                      type="checkbox"
                      checked={courseForm.isPublished || false}
                      onChange={(e) => setCourseForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
                    />
                    Xuất bản
                  </label>
                </div>

                <textarea
                  className={`${styles.searchBar} ${styles.formTextarea}`}
                  placeholder="Mô tả khóa học"
                  value={courseForm.description}
                  onChange={(e) => setCourseForm((prev) => ({ ...prev, description: e.target.value }))}
                />

                <div className={styles.formActions}>
                  <Button
                    variant="primary"
                    size="sm"
                    className={styles.downloadBtn}
                    type="submit"
                    disabled={savingCourse}
                  >
                    {savingCourse ? 'Đang lưu...' : editingCourseId ? 'Cập nhật khóa học' : 'Tạo khóa học'}
                  </Button>
                  {editingCourseId && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className={styles.tableActionBtn}
                      type="button"
                      onClick={resetCourseForm}
                    >
                      Hủy chỉnh sửa
                    </Button>
                  )}
                </div>
              </form>
            </section>

            <section className={styles.tableSection}>
              <div className={styles.tableHeader}>
                <h3>Danh sách khóa học</h3>
              </div>
              {courses.length === 0 ? (
                <PageState type="empty" message="Chưa có khóa học trong hệ thống." />
              ) : (
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
                        <td>{formatVnd(course.price || 0)}</td>
                        <td>{course.status || (course.isPublished ? 'PUBLISHED' : 'DRAFT')}</td>
                        <td className={styles.tableActionCell}>
                          <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            className={styles.tableActionBtn}
                            onClick={() => handleEditCourse(course)}
                          >
                            Sửa
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            className={styles.tableActionBtn}
                            onClick={() => handleToggleBlockCourse(course)}
                          >
                            {course.status === 'BLOCKED' ? 'Mở khóa' : 'Block'}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            className={styles.tableActionBtn}
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            Xóa
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        )}

        {!loading && activeTab === 'ai-traces' && (
          <section
            id="admin-panel-ai-traces"
            role="tabpanel"
            aria-labelledby="admin-tab-ai-traces"
            className={styles.tableSection}
          >
            <div className={styles.tableHeader}>
              <h3>AI Traces & Metrics</h3>
            </div>
            
            {aiStats && (
              <div className={styles.statsGrid} style={{ marginBottom: '20px' }}>
                <div className={styles.statCard}>
                  <div className={styles.statContent}>
                    <span className={styles.statValue}>{aiStats.totalTraces}</span>
                    <span className={styles.statLabel}>Total Traces</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statContent}>
                    <span className={styles.statValue}>{aiStats.avgLatencyMs}ms</span>
                    <span className={styles.statLabel}>Avg Latency</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statContent}>
                    <span className={styles.statValue}>{aiStats.totalInputTokens}</span>
                    <span className={styles.statLabel}>Input Tokens</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statContent}>
                    <span className={styles.statValue}>{aiStats.totalOutputTokens}</span>
                    <span className={styles.statLabel}>Output Tokens</span>
                  </div>
                </div>
              </div>
            )}

            {aiTraces.length === 0 ? (
              <PageState type="empty" message="Chưa có AI traces để hiển thị." />
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User ID</th>
                    <th>Conversation</th>
                    <th>Agent</th>
                    <th>Action</th>
                    <th>Message</th>
                    <th>Result</th>
                    <th>Latency</th>
                    <th>Tokens</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {aiTraces.slice(0, 100).map((trace, idx) => (
                    <tr key={idx}>
                      <td style={{ whiteSpace: 'nowrap' }}>{trace.createdAt ? new Date(trace.createdAt).toLocaleString('vi-VN') : '-'}</td>
                      <td>{trace.userId || '-'}</td>
                      <td style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={trace.conversationId || ''}>{trace.conversationId ? trace.conversationId.substring(0, 8) + '...' : '-'}</td>
                      <td>{trace.agentType || '-'}</td>
                      <td style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={trace.action || ''}>{trace.action || '-'}</td>
                      <td style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={trace.message || ''}>{trace.message ? trace.message.substring(0, 30) + '...' : '-'}</td>
                      <td style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={trace.result || ''}>{trace.result ? trace.result.substring(0, 30) + '...' : '-'}</td>
                      <td>{trace.latencyMs ? `${trace.latencyMs}ms` : '-'}</td>
                      <td>{trace.inputTokens || 0} / {trace.outputTokens || 0}</td>
                      <td>
                        {trace.requiresMoreInfo ? (
                          <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>⏳ Cần thêm info</span>
                        ) : (
                          <span style={{ color: '#10b981', fontSize: '0.75rem' }}>✓ OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {!loading && activeTab === 'ai-runtime' && (
          <section
            id="admin-panel-ai-runtime"
            role="tabpanel"
            aria-labelledby="admin-tab-ai-runtime"
            className={styles.tableSection}
          >
            <div className={styles.tableHeader}>
              <h3>Cấu hình AI Runtime</h3>
            </div>
            <form onSubmit={handleSaveAiRuntime}>
              <div className={styles.inputGridTwo}>
                <label className={styles.radioLabel}>
                  <input
                    type="checkbox"
                    checked={aiRuntimeForm.tutorEnabled}
                    onChange={(e) =>
                      setAiRuntimeForm((prev) => ({ ...prev, tutorEnabled: e.target.checked }))
                    }
                  />
                  Bật AI Tutor
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="checkbox"
                    checked={aiRuntimeForm.harnessEnabled}
                    onChange={(e) =>
                      setAiRuntimeForm((prev) => ({ ...prev, harnessEnabled: e.target.checked }))
                    }
                  />
                  Bật AI Harness
                </label>
              </div>

              <div className={styles.inputGridTwo}>
                <input
                  className={`${styles.searchBar} ${styles.formInput}`}
                  placeholder="Tutor primary model (vd: qwen/qwen3.6-plus:free)"
                  value={aiRuntimeForm.tutorModel || ''}
                  onChange={(e) => setAiRuntimeForm((prev) => ({ ...prev, tutorModel: e.target.value }))}
                />
                <input
                  className={`${styles.searchBar} ${styles.formInput}`}
                  placeholder="Tutor fallback model"
                  value={aiRuntimeForm.tutorFallbackModel || ''}
                  onChange={(e) =>
                    setAiRuntimeForm((prev) => ({ ...prev, tutorFallbackModel: e.target.value }))
                  }
                />
              </div>

              <textarea
                className={`${styles.searchBar} ${styles.promptTextarea}`}
                placeholder="Harness model pool (mỗi dòng 1 model hoặc phân tách bằng dấu phẩy)"
                value={(aiRuntimeForm.harnessModels || []).join('\n')}
                onChange={(e) =>
                  setAiRuntimeForm((prev) => ({
                    ...prev,
                    harnessModels: parseModelText(e.target.value),
                  }))
                }
              />

              <textarea
                className={`${styles.searchBar} ${styles.promptTextarea}`}
                placeholder="Blocked models (mỗi dòng 1 model hoặc phân tách bằng dấu phẩy)"
                value={(aiRuntimeForm.blockedModels || []).join('\n')}
                onChange={(e) =>
                  setAiRuntimeForm((prev) => ({
                    ...prev,
                    blockedModels: parseModelText(e.target.value),
                  }))
                }
              />

              <Button
                variant="primary"
                size="sm"
                className={styles.downloadBtn}
                type="submit"
                disabled={savingAiRuntime}
              >
                {savingAiRuntime ? 'Đang lưu...' : 'Lưu AI runtime'}
              </Button>
            </form>
          </section>
        )}

        {!loading && activeTab === 'audit-logs' && (
          <section
            id="admin-panel-audit-logs"
            role="tabpanel"
            aria-labelledby="admin-tab-audit-logs"
            className={styles.tableSection}
          >
            <div className={styles.tableHeader}>
              <h3>Admin Audit Logs</h3>
            </div>
            {auditLogs.length === 0 ? (
              <PageState type="empty" message="Chưa có audit logs." />
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Key</th>
                    <th>Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : '-'}
                      </td>
                      <td>{log.actor || '-'}</td>
                      <td>{log.action || '-'}</td>
                      <td>{log.resourceType || '-'}</td>
                      <td>{log.resourceKey || '-'}</td>
                      <td
                        style={{ maxWidth: '420px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        title={log.diffSummary || ''}
                      >
                        {log.diffSummary || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {!loading && activeTab === 'prompts' && (
          <section
            id="admin-panel-prompts"
            role="tabpanel"
            aria-labelledby="admin-tab-prompts"
            className={styles.tableSection}
          >
            <div className={styles.tableHeader}>
              <h3>Cấu hình AI Prompts</h3>
            </div>
            <form onSubmit={handleSavePrompts}>
              <textarea
                className={`${styles.searchBar} ${styles.promptTextarea}`}
                placeholder="tutorSystemPrompt"
                value={aiPromptForm.tutorSystemPrompt}
                onChange={(e) =>
                  setAIPromptForm((prev) => ({ ...prev, tutorSystemPrompt: e.target.value }))
                }
              />
              <textarea
                className={`${styles.searchBar} ${styles.promptTextarea}`}
                placeholder="examGeneratorPrompt"
                value={aiPromptForm.examGeneratorPrompt}
                onChange={(e) =>
                  setAIPromptForm((prev) => ({ ...prev, examGeneratorPrompt: e.target.value }))
                }
              />
              <Button
                variant="primary"
                size="sm"
                className={styles.downloadBtn}
                type="submit"
                disabled={savingPrompts}
              >
                {savingPrompts ? 'Đang lưu...' : 'Lưu AI prompts'}
              </Button>
            </form>
          </section>
        )}

        <footer className={styles.footer}>
          <p>© 2026 ThinkAI Quản trị hệ thống.</p>
        </footer>
      </main>
    </div>
  );
}
