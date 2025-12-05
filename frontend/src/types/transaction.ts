export type PaymentMethod = 'card' | 'pix' | 'boleto';

export type PaymentStatus = 
  | 'pending'
  | 'authorized'
  | 'paid'
  | 'refunded'
  | 'failed'
  | 'expired'
  | 'cancelled';

export interface Transaction {
  id: string;
  merchantId: string;
  customerId?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  provider: string;
  providerPaymentId: string;
  customerEmail: string;
  customerName?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionEvent {
  id: string;
  transactionId: string;
  type: 'authorization' | 'capture' | 'refund' | 'chargeback';
  status: 'pending' | 'success' | 'failed';
  amount: number;
  providerTxId: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface TransactionDetails extends Transaction {
  events: TransactionEvent[];
  providerResponse?: Record<string, unknown>;
  webhookDeliveries?: WebhookDelivery[];
}

export interface WebhookDelivery {
  id: string;
  url: string;
  status: 'pending' | 'success' | 'failed';
  retryCount: number;
  lastAttemptAt: string;
  response?: string;
}

export interface TransactionFilters {
  status?: PaymentStatus[];
  method?: PaymentMethod[];
  dateRange?: { from: string; to: string };
  search?: string;
  page?: number;
  limit?: number;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
