import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Merchant, 
  MerchantFilters, 
  MerchantListResponse, 
  CreateMerchantRequest,
  CreateMerchantResponse,
  MerchantStats
} from '@/types/merchant';
import { useAuthStore } from '@/stores/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function useMerchants(filters: MerchantFilters = {}) {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery<MerchantListResponse>({
    queryKey: ['merchants', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.status) {
        params.append('status', filters.status);
      }
      params.append('page', String(filters.page || 1));
      params.append('limit', String(filters.limit || 50));

      const response = await fetch(`${API_URL}/api/admin/merchants?${params}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch merchants');
      }

      return response.json();
    },
    enabled: !!accessToken,
  });
}

export function useMerchant(id: string) {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery<Merchant>({
    queryKey: ['merchant', id],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/admin/merchants/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch merchant');
      }

      return response.json();
    },
    enabled: !!accessToken && !!id,
  });
}

export function useMerchantStats(id: string) {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery<MerchantStats>({
    queryKey: ['merchant-stats', id],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/admin/merchants/${id}/stats`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch merchant stats');
      }

      return response.json();
    },
    enabled: !!accessToken && !!id,
  });
}

export function useCreateMerchant() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation<CreateMerchantResponse, Error, CreateMerchantRequest>({
    mutationFn: async (data) => {
      const response = await fetch(`${API_URL}/api/admin/merchants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create merchant');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
  });
}

export function useUpdateMerchantStatus() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const response = await fetch(`${API_URL}/api/admin/merchants/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ active }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update merchant status');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['merchant', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
  });
}

export function useUpdateMerchantProviders() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: async ({ 
      id, 
      providers 
    }: { 
      id: string; 
      providers: {
        pagarmeApiKey?: string;
        gerencianetClientId?: string;
        gerencianetClientSecret?: string;
        sandboxMode?: boolean;
      }
    }) => {
      const response = await fetch(`${API_URL}/api/admin/merchants/${id}/providers`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(providers),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update provider configuration');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['merchant', variables.id] });
    },
  });
}