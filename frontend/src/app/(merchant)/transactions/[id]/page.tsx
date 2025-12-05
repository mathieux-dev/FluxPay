'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTransaction } from '@/lib/hooks/use-transactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionTimeline } from '@/components/merchant/transaction-timeline';
import { WebhookDeliveryStatus } from '@/components/merchant/webhook-delivery-status';
import { RefundDialog } from '@/components/merchant/refund-dialog';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, RefreshCw } from 'lucide-react';

const statusColors = {
  pending: 'bg-yellow-500',
  authorized: 'bg-blue-500',
  paid: 'bg-green-600',
  refunded: 'bg-purple-500',
  failed: 'bg-red-600',
  expired: 'bg-gray-500',
  cancelled: 'bg-gray-600',
};

const statusLabels = {
  pending: 'Pendente',
  authorized: 'Autorizado',
  paid: 'Pago',
  refunded: 'Reembolsado',
  failed: 'Falhou',
  expired: 'Expirado',
  cancelled: 'Cancelado',
};

const methodLabels = {
  card: 'Cartão',
  pix: 'PIX',
  boleto: 'Boleto',
};

export default function TransactionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  
  const { data: transaction, isLoading } = useTransaction(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Transação não encontrada</p>
        <Button
          variant="outline"
          onClick={() => router.push('/transactions')}
          className="mt-4"
        >
          Voltar para Transações
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/transactions')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Detalhes da Transação</h1>
            <p className="text-muted-foreground font-mono">{transaction.id}</p>
          </div>
        </div>
        
        {transaction.status === 'paid' && (
          <Button
            onClick={() => setRefundDialogOpen(true)}
            className="bg-palmeiras-green hover:bg-palmeiras-green-light"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reembolsar
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={statusColors[transaction.status]}>
                  {statusLabels[transaction.status]}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="text-2xl font-bold">{formatCurrency(transaction.amount)}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Método de Pagamento</p>
                <p className="font-medium">{methodLabels[transaction.method]}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Provedor</p>
                <p className="font-medium">{transaction.provider}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{transaction.customerEmail}</p>
                {transaction.customerName && (
                  <p className="text-sm">{transaction.customerName}</p>
                )}
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">ID do Provedor</p>
                <p className="font-mono text-sm">{transaction.providerPaymentId}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Criado em</p>
                <p className="font-medium">
                  {format(new Date(transaction.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Atualizado em</p>
                <p className="font-medium">
                  {format(new Date(transaction.updatedAt), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          </div>
          
          {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-muted-foreground mb-2">Metadados</p>
              <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                {JSON.stringify(transaction.metadata, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionTimeline events={transaction.events} />

      {transaction.providerResponse && (
        <Card>
          <CardHeader>
            <CardTitle>Resposta do Provedor</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-xs overflow-auto">
              {JSON.stringify(transaction.providerResponse, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {transaction.webhookDeliveries && transaction.webhookDeliveries.length > 0 && (
        <WebhookDeliveryStatus deliveries={transaction.webhookDeliveries} />
      )}

      <RefundDialog
        transactionId={transaction.id}
        transactionAmount={transaction.amount}
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
      />
    </div>
  );
}
