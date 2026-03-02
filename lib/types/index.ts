// ==================== AUTH TYPES ====================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ==================== USER TYPES ====================
export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  phone?: string;
  address?: string;
  bio?: string;
  createdAt: string;
}

export interface UserProfile extends User {
  achievements: Achievement[];
  enrolledCourses: number;
  completedCourses: number;
  totalStudyTime: number;
}

export interface Achievement {
  id: number;
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}

// ==================== COURSE TYPES ====================
export interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  instructor: Instructor;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  studentCount: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: string;
  lessonsCount: number;
  category: string;
  tags: string[];
  createdAt: string;
}

export interface CourseDetail extends Course {
  curriculum: CurriculumSection[];
  learningPoints: string[];
  requirements: string[];
  reviews: Review[];
}

export interface CurriculumSection {
  id: number;
  title: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: number;
  title: string;
  duration: string;
  type: 'VIDEO' | 'QUIZ' | 'READING';
  completed: boolean;
  locked: boolean;
}

export interface Instructor {
  id: number;
  name: string;
  avatar: string;
  title: string;
  bio: string;
  rating: number;
  studentCount: number;
  courseCount: number;
}

export interface Review {
  id: number;
  user: Pick<User, 'id' | 'name' | 'avatar'>;
  rating: number;
  comment: string;
  createdAt: string;
}

// ==================== EXAM TYPES ====================
export interface Exam {
  id: number;
  title: string;
  description: string;
  duration: number; // minutes
  questionCount: number;
  passingScore: number;
  type: 'PRACTICE' | 'OFFICIAL';
}

export interface ExamQuestion {
  id: number;
  text: string;
  options: string[];
  correctAnswer?: number; // Only in result
}

export interface ExamResult {
  id: number;
  examId: number;
  examTitle: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeSpent: string;
  answers: AnswerDetail[];
  completedAt: string;
}

export interface AnswerDetail {
  questionId: number;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

// ==================== AI TUTOR TYPES ====================
export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: number;
}

export interface ChatResponse {
  message: ChatMessage;
  conversationId: number;
}

// ==================== PAYMENT TYPES ====================
export interface PaymentRequest {
  planId: number;
  paymentMethod: 'CARD' | 'QR' | 'WALLET';
  couponCode?: string;
}

export interface PaymentResponse {
  transactionId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  amount: number;
  redirectUrl?: string;
}

export interface Plan {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  cycle: 'MONTHLY' | 'YEARLY';
  features: string[];
}

// ==================== ADMIN TYPES ====================
export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  avgStudyTime: string;
  monthlyRevenue: number;
  userGrowth: number[];
  revenueGrowth: number[];
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  joinedAt: string;
}

// ==================== API RESPONSE WRAPPER ====================
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
