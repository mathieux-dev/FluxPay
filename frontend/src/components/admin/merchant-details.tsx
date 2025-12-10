'use client';

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Mail, User, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Merchant } from '@/types/merchant';

interface MerchantDetailsProps {
  merchant: Merchant;
}

export function MerchantDetails({ merchant }: MerchantDetailsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount / 100);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Informações Básicas</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Hash className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">ID</p>
              <p className="text-sm text-muted-foreground font-mono">{merchant.id}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <User className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Nome</p>
              <p className="text-sm text-muted-foreground">{merchant.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{merchant.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Criado em</p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(merchant.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo de Atividade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Volume Total</span>
            <span className="text-sm font-mono">
              {formatCurrency(merchant.totalVolume)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total de Transações</span>
            <span className="text-sm font-mono">
              {merchant.transactionCount.toLocaleString('pt-BR')}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Ticket Médio</span>
            <span className="text-sm font-mono">
              {merchant.transactionCount > 0
                ? formatCurrency(merchant.totalVolume / merchant.transactionCount)
                : 'R$ 0,00'
              }
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Status</span>
            <span className={`text-sm font-medium ${
              merchant.active ? 'text-green-600' : 'text-red-600'
            }`}>
              {merchant.active ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}