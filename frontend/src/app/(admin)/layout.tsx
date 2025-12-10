'use client';

import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { DashboardLayout } from '@/components/shared/dashboard-layout';
import { adminNavItems } from '@/components/shared/sidebar';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useRequireAuth('/login');
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !user.isAdmin) {
      redirect('/dashboard');
    }
  }, [isAuthenticated, isLoading, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-palmeiras-green"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  return (
    <DashboardLayout navItems={adminNavItems}>
      {children}
    </DashboardLayout>
  );
}