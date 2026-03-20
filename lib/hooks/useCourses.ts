'use client';

import { useState, useEffect, useCallback } from 'react';
import { coursesApi } from '../api/courses';
import type { Course, CourseDetail, PaginatedResponse } from '../types';
import type { ApiError } from '../api/client';

interface UseCourseListOptions {
  page?: number;
  pageSize?: number;
  category?: string;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  search?: string;
  sortBy?: 'popular' | 'newest' | 'rating' | 'price';
}

interface UseCourseListReturn {
  courses: Course[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
  isLoading: boolean;
  error: ApiError | null;
  refetch: (options?: UseCourseListOptions) => Promise<void>;
}

export function useCourseList(options: UseCourseListOptions = {}): UseCourseListReturn {
  const [data, setData] = useState<PaginatedResponse<Course> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchCourses = useCallback(async (opts: UseCourseListOptions) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await coursesApi.getCourses(opts);
      setData(response);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses(options);
  }, [fetchCourses, options]);

  const refetch = useCallback((opts?: UseCourseListOptions) => {
    return fetchCourses(opts || options);
  }, [fetchCourses, options]);

  return {
    courses: data?.items || [],
    pagination: {
      total: data?.total || 0,
      page: data?.page || 1,
      totalPages: data?.totalPages || 1,
    },
    isLoading,
    error,
    refetch,
  };
}

// Hook for single course detail
export function useCourseDetail(courseId: number) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const data = await coursesApi.getCourseById(courseId);
        setCourse(data);
      } catch (err) {
        setError(err as ApiError);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (courseId) fetch();
  }, [courseId]);

  const enroll = useCallback(async () => {
    await coursesApi.enrollCourse(courseId);
  }, [courseId]);

  return { course, isLoading, error, enroll };
}

// Hook for enrolled courses
export function useEnrolledCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await coursesApi.getEnrolledCourses();
        setCourses(data);
      } catch {
        // Handle error silently
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  return { courses, isLoading };
}

// Hook for featured courses
export function useFeaturedCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await coursesApi.getFeaturedCourses();
        setCourses(data);
      } catch {
        // Handle error silently
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  return { courses, isLoading };
}
