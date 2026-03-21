import { apiRequest } from './api';

export interface ExamSummary {
  id: number;
  examType?: string;
  title: string;
  description?: string;
  timeLimitMinutes: number;
  passingScore?: number;
  createdAt?: string;
}

export interface ExamQuestion {
  id: number;
  content: string;
  type: string;
  options: string[];
  orderIndex?: number;
}

export interface StartExamResponse {
  attemptId: number;
  examId: number;
  examType?: string;
  title: string;
  description?: string;
  timeLimitMinutes: number;
  totalQuestions: number;
  startedAt: string;
  questions: ExamQuestion[];
}

export interface SubmitExamRequest {
  attemptId: number;
  answers: Array<{
    questionId: number;
    selectedOption: string;
  }>;
}

export interface SubmitExamResponse {
  attemptId: number;
  examTitle: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  isPassed: boolean;
  passingScore: number;
  submittedAt: string;
  timeTakenSeconds: number;
}

export interface ExamResultDetail {
  questionId: number;
  content: string;
  options: string[];
  orderIndex?: number;
  selectedOption: string;
  correctOption: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface ExamResultResponse {
  attemptId: number;
  examTitle: string;
  examType?: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  isPassed: boolean;
  passingScore: number;
  startedAt: string;
  submittedAt: string;
  timeTakenSeconds: number;
  answers: ExamResultDetail[];
  aiFeedback?: string;
}

export interface ExamHistoryItem {
  attemptId: number;
  examId: number;
  examTitle: string;
  examType?: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  isPassed: boolean;
  startedAt: string;
  submittedAt: string;
  timeTakenSeconds: number;
}

function parseQuestionOptions(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

function mapQuestions(questions: Array<Omit<ExamQuestion, 'options'> & { options: string }>): ExamQuestion[] {
  return questions.map((question) => ({
    ...question,
    options: parseQuestionOptions(question.options),
  }));
}

function mapResultAnswers(
  answers: Array<Omit<ExamResultDetail, 'options'> & { options: string }>
): ExamResultDetail[] {
  return answers.map((answer) => ({
    ...answer,
    options: parseQuestionOptions(answer.options),
  }));
}

export async function getCourseExams(courseId: number): Promise<ExamSummary[]> {
  return apiRequest<ExamSummary[]>(`/exams/${courseId}/exams`);
}

export async function startExam(examId: number, userId?: number | null): Promise<StartExamResponse> {
  const endpoint = typeof userId === 'number'
    ? `/exams/${examId}/start?userId=${userId}`
    : `/exams/${examId}/start`;

  const response = await apiRequest<Omit<StartExamResponse, 'questions'> & {
    questions: Array<Omit<ExamQuestion, 'options'> & { options: string }>;
  }>(endpoint, {
    method: 'POST',
  });

  return {
    ...response,
    questions: mapQuestions(response.questions || []),
  };
}

export async function submitExam(examId: number, payload: SubmitExamRequest): Promise<SubmitExamResponse> {
  return apiRequest<SubmitExamResponse>(`/exams/${examId}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getExamResult(attemptId: number): Promise<ExamResultResponse> {
  const response = await apiRequest<Omit<ExamResultResponse, 'answers'> & {
    answers: Array<Omit<ExamResultDetail, 'options'> & { options: string }>;
  }>(`/exams/attempts/${attemptId}/result`);

  return {
    ...response,
    answers: mapResultAnswers(response.answers || []),
  };
}

export async function getExamHistory(userId?: number | null): Promise<ExamHistoryItem[]> {
  const endpoint = typeof userId === 'number'
    ? `/exams/history?userId=${userId}`
    : '/exams/history';
  return apiRequest<ExamHistoryItem[]>(endpoint);
}
