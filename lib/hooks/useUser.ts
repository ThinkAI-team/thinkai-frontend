'use client';

import { useState, useEffect, useCallback } from 'react';
import { usersApi } from '../api/users';
import type { UserProfile, User, Achievement } from '../types';
import type { ApiError } from '../api/client';

interface UseUserReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: ApiError | null;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useUser(): UseUserReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await usersApi.getProfile();
      setProfile(data);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    setIsLoading(true);
    try {
      const updatedUser = await usersApi.updateProfile(data);
      setProfile((prev) => prev ? { ...prev, ...updatedUser } : null);
    } catch (err) {
      setError(err as ApiError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      await usersApi.updatePassword({ currentPassword, newPassword });
    } catch (err) {
      setError(err as ApiError);
      throw err;
    }
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    try {
      const avatarUrl = await usersApi.uploadAvatar(file);
      setProfile((prev) => prev ? { ...prev, avatar: avatarUrl } : null);
    } catch (err) {
      setError(err as ApiError);
      throw err;
    }
  }, []);

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    updatePassword,
    uploadAvatar,
    refreshProfile: fetchProfile,
  };
}

// Hook for achievements only
export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await usersApi.getAchievements();
        setAchievements(data);
      } catch {
        // Handle error silently
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  return { achievements, isLoading };
}
