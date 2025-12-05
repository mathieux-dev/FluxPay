'use client';

import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useDashboardStats, useDashboardChart, useRecentTransactions } from '@/lib/hooks/use-dashboard';
import { DashboardStats } from '@/components/merchant/dashboard-stats';
import { TransactionChart } from '@/components/merchant/transaction-chart';
import { RecentTransactions } from '@/components/merchant/recent-transactions';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: chartData, isLoading: chartLoading } = useDashboardChart();
  const { data: recentTransactions, isLoading: transactionsLoading } = useRecentTransactions();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {statsLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : stats ? (
        <DashboardStats stats={stats} />
      ) : null}

      {chartLoading ? (
        <Skeleton className="h-[400px]" />
      ) : chartData && chartData.length > 0 ? (
        <TransactionChart data={chartData} />
      ) : null}

      {transactionsLoading ? (
        <Skeleton className="h-[400px]" />
      ) : recentTransactions ? (
        <RecentTransactions transactions={recentTransactions} />
      ) : null}
    </div>
  );
}
