'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateSubscription } from '@/lib/hooks/use-subscriptions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { SubscriptionInterval } from '@/types/subscription';

const subscriptionSchema = z.object({
  customerId: z.string().min(1, 'ID do cliente é obrigatório'),
  customerName: z.string().min(1, 'Nome do cliente é obrigatório'),
  customerEmail: z.string().email('Email inválido'),
  amount: z.string().min(1, 'Valor é obrigatório').transform(val => {
    const num = parseFloat(val.replace(',', '.'));
    if (isNaN(num) || num <= 0) throw new Error('Valor inválido');
    return Math.round(num * 100);
  }),
  interval: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  cardToken: z.string().min(1, 'Token do cartão é obrigatório'),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

interface CreateSubscriptionFormProps {
  onSuccess: (subscriptionId: string) => void;
  onCancel: () => void;
}

export function CreateSubscriptionForm({ onSuccess, onCancel }: CreateSubscriptionFormProps) {
  const [error, setError] = useState<string | null>(null);
  const { mutate: createSubscription, isPending } = useCreateSubscription();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      interval: 'monthly',
    },
  });

  const interval = watch('interval');

  const onSubmit = (data: SubscriptionFormData) => {
    setError(null);
    createSubscription(data, {
      onSuccess: (response) => {
        onSuccess(response.id);
      },
      onError: (err) => {
        setError(err.message);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Cliente</CardTitle>
          <CardDescription>Dados do cliente para a assinatura</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="customerId">ID do Cliente</Label>
            <Input
              id="customerId"
              {...register('customerId')}
              placeholder="cus_123456"
            />
            {errors.customerId && (
              <p className="text-sm text-red-600 mt-1">{errors.customerId.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="customerName">Nome do Cliente</Label>
            <Input
              id="customerName"
              {...register('customerName')}
              placeholder="João Silva"
            />
            {errors.customerName && (
              <p className="text-sm text-red-600 mt-1">{errors.customerName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="customerEmail">Email do Cliente</Label>
            <Input
              id="customerEmail"
              type="email"
              {...register('customerEmail')}
              placeholder="joao@example.com"
            />
            {errors.customerEmail && (
              <p className="text-sm text-red-600 mt-1">{errors.customerEmail.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Assinatura</CardTitle>
          <CardDescription>Configure o valor e frequência da cobrança</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              {...register('amount')}
              placeholder="99.90"
              type="text"
            />
            {errors.amount && (
              <p className="text-sm text-red-600 mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="interval">Intervalo de Cobrança</Label>
            <Select
              value={interval}
              onValueChange={(value) => setValue('interval', value as SubscriptionInterval)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
            {errors.interval && (
              <p className="text-sm text-red-600 mt-1">{errors.interval.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagamento</CardTitle>
          <CardDescription>Token do cartão para cobrança recorrente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cardToken">Token do Cartão</Label>
            <Input
              id="cardToken"
              {...register('cardToken')}
              placeholder="tok_123456789"
            />
            {errors.cardToken && (
              <p className="text-sm text-red-600 mt-1">{errors.cardToken.message}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Use a tokenização de cartão para obter o token
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar Assinatura
        </Button>
      </div>
    </form>
  );
}
