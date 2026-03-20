import { apiRequest } from './api';

export interface ExamSummary {
  id: number;
  title: string;
  description?: string;
  durationMinutes: number;
  totalQuestions: number;
  createdAt?: string;
}

export interface ExamQuestion {
  id: number;
  content: string;
  type: string;
  options: string[];
}

export interface StartExamResponse {
  examSessionId: number;
  examId: number;
  startTime: string;
  questions: ExamQuestion[];
}

export interface SubmitExamRequest {
  examSessionId: number;
  answers: Array<{
    questionId: number;
    selectedOption: string;
  }>;
}

export interface SubmitExamResponse {
  resultId: number;
  examId: number;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  message: string;
}

export interface ExamResultDetail {
  questionId: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface ExamResultResponse {
  resultId: number;
  score: number;
  details: ExamResultDetail[];
  aiFeedback?: string;
}

export interface ExamHistoryItem {
  resultId: number;
  examTitle: string;
  score: number;
  completedAt: string;
}

export async function getCourseExams(courseId: number): Promise<ExamSummary[]> {
  return apiRequest<ExamSummary[]>(`/exams/${courseId}/exams`);
}

export async function startExam(examId: number): Promise<StartExamResponse> {
  return apiRequest<StartExamResponse>(`/exams/${examId}/start`, {
    method: 'POST',
  });
}

export async function submitExam(examId: number, payload: SubmitExamRequest): Promise<SubmitExamResponse> {
  return apiRequest<SubmitExamResponse>(`/exams/${examId}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getExamResult(resultId: number): Promise<ExamResultResponse> {
  return apiRequest<ExamResultResponse>(`/exams/results/${resultId}`);
}

export async function getExamHistory(): Promise<ExamHistoryItem[]> {
  return apiRequest<ExamHistoryItem[]>('/exams/history');
}
