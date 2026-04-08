'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/terms',
  '/privacy',
]);

const STUDENT_PREFIXES = [
  '/dashboard',
  '/my-courses',
  '/learn',
  '/cart',
  '/payment',
  '/subscription',
  '/exams',
  '/profile',
  '/settings',
  '/ai-tutor',
];

function normalizeRole(role?: string | null): UserRole | null {
  if (!role) return null;
  const normalized = role.replace(/^ROLE_/, '').toUpperCase();
  if (normalized === 'ADMIN' || normalized === 'TEACHER' || normalized === 'STUDENT') {
    return normalized;
  }
  return null;
}

function startsWithPath(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function requiredRoleForPath(pathname: string): UserRole | null {
  if (startsWithPath(pathname, '/admin')) return 'ADMIN';
  if (startsWithPath(pathname, '/teacher')) return 'TEACHER';
  if (STUDENT_PREFIXES.some((prefix) => startsWithPath(pathname, prefix))) return 'STUDENT';
  return null;
}

function defaultPathByRole(role: UserRole | null): string {
  if (role === 'ADMIN') return '/admin';
  if (role === 'TEACHER') return '/teacher';
  return '/dashboard';
}

interface RouteAccessGuardProps {
  children: React.ReactNode;
}

export default function RouteAccessGuard({ children }: RouteAccessGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [checked, setChecked] = useState(false);

  const normalizedPath = useMemo(() => {
    const value = pathname || '/';
    return value.length > 1 && value.endsWith('/') ? value.slice(0, -1) : value;
  }, [pathname]);

  useEffect(() => {
    // Public pages are always available.
    if (PUBLIC_PATHS.has(normalizedPath)) {
      setAllowed(true);
      setChecked(true);
      return;
    }

    const requiredRole = requiredRoleForPath(normalizedPath);
    if (!requiredRole) {
      setAllowed(true);
      setChecked(true);
      return;
    }

    const token = localStorage.getItem('thinkai_access_token') || localStorage.getItem('token');
    const rawUser = localStorage.getItem('user');
    let roleFromStorage: UserRole | null = null;
    if (rawUser) {
      try {
        roleFromStorage = normalizeRole(JSON.parse(rawUser)?.role);
      } catch {
        roleFromStorage = null;
      }
    }

    if (!token) {
      setAllowed(false);
      setChecked(true);
      router.replace('/login');
      return;
    }

    if (roleFromStorage === requiredRole) {
      setAllowed(true);
      setChecked(true);
      return;
    }

    setAllowed(false);
    setChecked(true);
    router.replace(defaultPathByRole(roleFromStorage));
  }, [normalizedPath, router]);

  if (!checked || !allowed) return null;
  return <>{children}</>;
}
