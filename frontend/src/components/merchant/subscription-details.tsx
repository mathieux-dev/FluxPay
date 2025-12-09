'use client';

import { SubscriptionDetails } from '@/types/subscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SubscriptionDetailsProps {
  subscription: SubscriptionDetails;
}

const statusColors = {
  active: 'default' as const,
  cancelled: 'destructive' as const,
  past_due: 'secondary' as const,
};

const statusLabels = {
  active: 'Ativa',
  cancelled: 'Cancelada',
  past_due: 'Atrasada',
};

const intervalLabels = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
};

const chargeStatusColors = {
  pending: 'secondary' as const,
  paid: 'default' as const,
  failed: 'destructive' as const,
};

const chargeStatusLabels = {
  pending: 'Pendente',
  paid: 'Pago',
  failed: 'Falhou',
};

export function SubscriptionDetailsComponent({ subscription }: SubscriptionDetailsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Informações da Assinatura</CardTitle>
              <CardDescription>ID: {subscription.id}</CardDescription>
            </div>
            <Badge variant={statusColors[subscription.status]}>
              {statusLabels[subscription.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{subscription.customerName}</p>
              <p className="text-sm text-muted-foreground">{subscription.customerEmail}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ID do Cliente</p>
              <p className="font-medium">{subscription.customerId}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className="font-medium text-lg">{formatCurrency(subscription.amount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Intervalo</p>
              <p className="font-medium">{intervalLabels[subscription.interval]}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Próxima Cobrança</p>
              <p className="font-medium">
                {subscription.status === 'active'
                  ? format(new Date(subscription.nextBillingDate), 'dd/MM/yyyy', { locale: ptBR })
                  : '-'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Criada em</p>
              <p className="font-medium">
                {format(new Date(subscription.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </p>
            </div>
          </div>

          {subscription.cancelledAt && (
            <div>
              <p className="text-sm text-muted-foreground">Cancelada em</p>
              <p className="font-medium">
                {format(new Date(subscription.cancelledAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground">ID da Assinatura no Provedor</p>
            <p className="font-mono text-sm">{subscription.providerSubscriptionId}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Cobranças</CardTitle>
          <CardDescription>
            {subscription.charges.length} cobrança{subscription.charges.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscription.charges.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma cobrança realizada ainda
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data de Cobrança</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Pagamento</TableHead>
                  <TableHead>Motivo da Falha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscription.charges.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell>
                      {format(new Date(charge.billingDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(charge.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={chargeStatusColors[charge.status]}>
                        {chargeStatusLabels[charge.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {charge.paidAt
                        ? format(new Date(charge.paidAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {charge.failureReason || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
