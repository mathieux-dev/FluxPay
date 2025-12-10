export interface Merchant {
  id: string;
  name: string;
  email: string;
  active: boolean;
  totalVolume: number;
  transactionCount: number;
  createdAt: string;
  updatedAt: string;
  providerConfig?: {
    pagarme?: {
      apiKey: string;
      sandbox: boolean;
    };
    gerencianet?: {
      clientId: string;
      clientSecret: string;
      sandbox: boolean;
    };
  };
}

export interface MerchantFilters {
  search?: string;
  status?: 'active' | 'inactive';
  page?: number;
  limit?: number;
}

export interface MerchantListResponse {
  merchants: Merchant[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateMerchantRequest {
  name: string;
  email: string;
  pagarmeApiKey?: string;
  gerencianetClientId?: string;
  gerencianetClientSecret?: string;
}

export interface CreateMerchantResponse {
  merchant: Merchant;
  apiKey: string;
  apiSecret: string;
}

export interface MerchantStats {
  totalTransactions: number;
  totalVolume: number;
  successRate: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}