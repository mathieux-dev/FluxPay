'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  APIKey, 
  CreateAPIKeyRequest,
  CreateAPIKeyResponse,
  RotateAPIKeyRequest,
  RotateAPIKeyResponse,
  RevokeAPIKeyRequest
} from '@/types/api-key';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function useAPIKeys() {
  return useQuery<APIKey[]>({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/api-keys`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch API keys');
      return res.json();
    },
  });
}

export function useCreateAPIKey() {
  const queryClient = useQueryClient();
  
  return useMutation<CreateAPIKeyResponse, Error, CreateAPIKeyRequest>({
    mutationFn: async (data) => {
      const res = await fetch(`${API_URL}/api/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create API key');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });
}

export function useRotateAPIKey() {
  const queryClient = useQueryClient();
  
  return useMutation<RotateAPIKeyResponse, Error, RotateAPIKeyRequest>({
    mutationFn: async (data) => {
      const res = await fetch(`${API_URL}/api/api-keys/${data.keyId}/rotate`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to rotate API key');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });
}

export function useRevokeAPIKey() {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, RevokeAPIKeyRequest>({
    mutationFn: async (data) => {
      const res = await fetch(`${API_URL}/api/api-keys/${data.keyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to revoke API key');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });
}
