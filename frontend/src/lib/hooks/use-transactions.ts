import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Transaction, TransactionFilters, TransactionListResponse, TransactionDetails } from '@/types/transaction';
import { useAuthStore } from '@/stores/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function useTransactions(filters: TransactionFilters = {}) {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery<TransactionListResponse>({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.status?.length) {
        filters.status.forEach(s => params.append('status', s));
      }
      if (filters.method?.length) {
        filters.method.forEach(m => params.append('method', m));
      }
      if (filters.dateRange?.from) {
        params.append('from', filters.dateRange.from);
      }
      if (filters.dateRange?.to) {
        params.append('to', filters.dateRange.to);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      params.append('page', String(filters.page || 1));
      params.append('limit', String(filters.limit || 50));

      const response = await fetch(`${API_URL}/api/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      return response.json();
    },
    enabled: !!accessToken,
    refetchInterval: 10000,
  });
}

export function useTransaction(id: string) {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery<TransactionDetails>({
    queryKey: ['transaction', id],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/transactions/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transaction');
      }

      return response.json();
    },
    enabled: !!accessToken && !!id,
  });
}

export function useRefundTransaction() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount?: number }) => {
      const response = await fetch(`${API_URL}/api/transactions/${id}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to refund transaction');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transaction', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useExportTransactions() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: async ({ 
      format, 
      filters 
    }: { 
      format: 'csv' | 'excel' | 'json'; 
      filters: TransactionFilters 
    }) => {
      const params = new URLSearchParams();
      
      if (filters.status?.length) {
        filters.status.forEach(s => params.append('status', s));
      }
      if (filters.method?.length) {
        filters.method.forEach(m => params.append('method', m));
      }
      if (filters.dateRange?.from) {
        params.append('from', filters.dateRange.from);
      }
      if (filters.dateRange?.to) {
        params.append('to', filters.dateRange.to);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      params.append('format', format);

      const response = await fetch(`${API_URL}/api/transactions/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to export transactions');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${Date.now()}.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });
}
