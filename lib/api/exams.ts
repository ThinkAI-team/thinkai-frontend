import apiClient, { handleApiError } from "./client";
import type {
  Exam,
  ExamQuestion,
  ExamResult,
  PaginatedResponse,
  ApiResponse,
} from "../types";

interface ExamSession {
  sessionId: string;
  questions: ExamQuestion[];
  duration: number;
  startedAt: string;
}

interface SubmitExamRequest {
  sessionId: string;
  answers: { questionId: number; answer: number }[];
}

/**
 * Exams API endpoints
 */
export const examsApi = {
  /**
   * Get list of available exams
   */
  getExams: async (): Promise<Exam[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Exam[]>>("/api/exams");
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get exam detail
   */
  getExamById: async (examId: number): Promise<Exam> => {
    try {
      const response = await apiClient.get<ApiResponse<Exam>>(
        `/api/exams/${examId}`,
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Start exam - get questions
   */
  startExam: async (examId: number): Promise<ExamSession> => {
    try {
      const response = await apiClient.post<ApiResponse<ExamSession>>(
        `/api/exams/${examId}/start`,
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Submit exam answers
   */
  submitExam: async (data: SubmitExamRequest): Promise<ExamResult> => {
    try {
      const response = await apiClient.post<ApiResponse<ExamResult>>(
        "/api/exams/submit",
        data,
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get exam result
   */
  getExamResult: async (examId: number): Promise<ExamResult> => {
    try {
      const response = await apiClient.get<ApiResponse<ExamResult>>(
        `/api/exams/${examId}/result`,
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get exam history
   */
  getExamHistory: async (): Promise<ExamResult[]> => {
    try {
      const response =
        await apiClient.get<ApiResponse<ExamResult[]>>("/api/exams/history");
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default examsApi;
