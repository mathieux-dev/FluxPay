'use client';

import { Subscription, SubscriptionStatus } from '@/types/subscription';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onViewDetails: (id: string) => void;
  isLoading: boolean;
}

const statusColors: Record<SubscriptionStatus, 'default' | 'destructive' | 'secondary'> = {
  active: 'default',
  cancelled: 'destructive',
  past_due: 'secondary',
};

const statusLabels: Record<SubscriptionStatus, string> = {
  active: 'Ativa',
  cancelled: 'Cancelada',
  past_due: 'Atrasada',
};

const intervalLabels: Record<string, string> = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
};

export function SubscriptionList({ subscriptions, onViewDetails, isLoading }: SubscriptionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhuma assinatura encontrada</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Intervalo</TableHead>
          <TableHead>Próxima Cobrança</TableHead>
          <TableHead>Criada em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {subscriptions.map((subscription) => (
          <TableRow
            key={subscription.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onViewDetails(subscription.id)}
          >
            <TableCell>
              <div>
                <div className="font-medium">{subscription.customerName}</div>
                <div className="text-sm text-muted-foreground">{subscription.customerEmail}</div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={statusColors[subscription.status]}>
                {statusLabels[subscription.status]}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">{formatCurrency(subscription.amount)}</TableCell>
            <TableCell>{intervalLabels[subscription.interval]}</TableCell>
            <TableCell>
              {subscription.status === 'active' 
                ? format(new Date(subscription.nextBillingDate), 'dd/MM/yyyy', { locale: ptBR })
                : '-'
              }
            </TableCell>
            <TableCell>
              {format(new Date(subscription.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
