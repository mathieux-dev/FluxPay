'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export function useAuth() {
  const authStore = useAuthStore();

  useEffect(() => {
    const interval = setInterval(() => {
      if (authStore.isAuthenticated) {
        authStore.refreshToken().catch(() => {
          console.error('Token refresh failed');
        });
      }
    }, 13 * 60 * 1000);

    return () => clearInterval(interval);
  }, [authStore]);

  return authStore;
}

export function useRequireAuth(redirectTo = '/login') {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  return { isAuthenticated, isLoading };
}
