import { apiRequest } from './api';

export interface AdminDashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  activeStudents: number;
  activeTeachers: number;
  aiChatsToday: number;
}

export interface AdminAiRuntimeSettings {
  tutorEnabled: boolean;
  harnessEnabled: boolean;
  tutorModel?: string | null;
  tutorFallbackModel?: string | null;
  harnessModels: string[];
  blockedModels: string[];
}

export interface AiTraceMetric {
  createdAt: string;
  userId: number;
  conversationId: string;
  agentType: string;
  action: string;
  message: string;
  result: string;
  requiresMoreInfo: boolean;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
}

export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  isActive: boolean;
}

export interface AdminUserPage {
  content: AdminUser[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminUsersQuery {
  page?: number;
  size?: number;
  keyword?: string;
  role?: 'STUDENT' | 'TEACHER' | 'ADMIN';
  isActive?: boolean;
}

export interface AdminCourse {
  id: number;
  title: string;
  description?: string;
  thumbnailUrl?: string | null;
  price: number;
  instructorId?: number;
  instructorName?: string;
  isPublished?: boolean;
  status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminCoursePage {
  content: AdminCourse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminCoursesQuery {
  page?: number;
  size?: number;
  keyword?: string;
}

export interface AdminAuditLog {
  id: number;
  actor: string;
  action: string;
  resourceType: string;
  resourceKey: string;
  diffSummary?: string;
  beforeSnapshot?: string;
  afterSnapshot?: string;
  createdAt: string;
}

export interface AdminAuditLogPage {
  content: AdminAuditLog[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminAuditLogsQuery {
  page?: number;
  size?: number;
  actor?: string;
  action?: string;
  resourceType?: string;
}

export interface AdminCourseRequest {
  title: string;
  description: string;
  price: number;
  instructorId: number;
  thumbnailUrl?: string;
  isPublished?: boolean;
  status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
}

function buildAdminCoursesQuery(query: AdminCoursesQuery = {}): string {
  const params = new URLSearchParams();
  if (typeof query.page === 'number') params.set('page', String(query.page));
  if (typeof query.size === 'number') params.set('size', String(query.size));
  if (query.keyword) params.set('keyword', query.keyword);
  const qs = params.toString();
  return qs ? `/admin/courses?${qs}` : '/admin/courses';
}

function buildAdminUsersQuery(query: AdminUsersQuery = {}): string {
  const params = new URLSearchParams();
  if (typeof query.page === 'number') params.set('page', String(query.page));
  if (typeof query.size === 'number') params.set('size', String(query.size));
  if (query.keyword) params.set('keyword', query.keyword);
  if (query.role) params.set('role', query.role);
  if (typeof query.isActive === 'boolean') params.set('isActive', String(query.isActive));
  const qs = params.toString();
  return qs ? `/admin/users?${qs}` : '/admin/users';
}

function buildAdminAuditLogsQuery(query: AdminAuditLogsQuery = {}): string {
  const params = new URLSearchParams();
  if (typeof query.page === 'number') params.set('page', String(query.page));
  if (typeof query.size === 'number') params.set('size', String(query.size));
  if (query.actor) params.set('actor', query.actor);
  if (query.action) params.set('action', query.action);
  if (query.resourceType) params.set('resourceType', query.resourceType);
  const qs = params.toString();
  return qs ? `/admin/audit-logs?${qs}` : '/admin/audit-logs';
}

export async function getAdminDashboard(): Promise<AdminDashboardStats> {
  return apiRequest<AdminDashboardStats>('/admin/dashboard');
}

export async function getAdminUsers(query: AdminUsersQuery = {}): Promise<AdminUserPage> {
  return apiRequest<AdminUserPage>(buildAdminUsersQuery(query));
}

export async function updateAdminUserStatus(userId: number, isActive: boolean): Promise<{ userId: number; isActive: boolean }> {
  return apiRequest<{ userId: number; isActive: boolean }>(`/admin/users/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ isActive }),
  });
}

export async function updateAIPrompts(payload: { tutorSystemPrompt: string; examGeneratorPrompt: string }): Promise<boolean> {
  return apiRequest<boolean>('/admin/settings/ai-prompts', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function getAdminCourses(query: AdminCoursesQuery = {}): Promise<AdminCoursePage> {
  return apiRequest<AdminCoursePage>(buildAdminCoursesQuery(query));
}

export async function createAdminCourse(payload: AdminCourseRequest): Promise<{ courseId: number }> {
  return apiRequest<{ courseId: number }>('/admin/courses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAdminCourse(courseId: number, payload: AdminCourseRequest): Promise<AdminCourse> {
  return apiRequest<AdminCourse>(`/admin/courses/${courseId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminCourse(courseId: number): Promise<void> {
  return apiRequest<void>(`/admin/courses/${courseId}`, {
    method: 'DELETE',
  });
}

export async function blockAdminCourse(
  courseId: number,
  blocked: boolean,
  restoreStatus?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'
): Promise<{ courseId: number; status: string; isPublished: boolean; blocked: boolean }> {
  return apiRequest<{ courseId: number; status: string; isPublished: boolean; blocked: boolean }>(
    `/admin/courses/${courseId}/block`,
    {
      method: 'PUT',
      body: JSON.stringify({
        blocked,
        restoreStatus,
      }),
    }
  );
}

export async function getAiTraces(conversationId?: string): Promise<AiTraceMetric[]> {
  const endpoint = conversationId 
    ? `/admin/ai/traces?conversationId=${conversationId}`
    : '/admin/ai/traces';
  return apiRequest<AiTraceMetric[]>(endpoint);
}

export async function getAiStats(): Promise<{
  totalTraces: number;
  avgLatencyMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  agentUsage: Record<string, number>;
}> {
  return apiRequest<{
    totalTraces: number;
    avgLatencyMs: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    agentUsage: Record<string, number>;
  }>('/admin/ai/stats');
}

export async function getAdminAuditLogs(query: AdminAuditLogsQuery = {}): Promise<AdminAuditLogPage> {
  return apiRequest<AdminAuditLogPage>(buildAdminAuditLogsQuery(query));
}

export async function getAdminAiRuntimeSettings(): Promise<AdminAiRuntimeSettings> {
  return apiRequest<AdminAiRuntimeSettings>('/admin/settings/ai-runtime');
}

export async function updateAdminAiRuntimeSettings(payload: AdminAiRuntimeSettings): Promise<AdminAiRuntimeSettings> {
  return apiRequest<AdminAiRuntimeSettings>('/admin/settings/ai-runtime', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
