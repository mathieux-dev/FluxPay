'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscriptions } from '@/lib/hooks/use-subscriptions';
import { SubscriptionList } from '@/components/merchant/subscription-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function SubscriptionsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSubscriptions(page);

  const handleViewDetails = (id: string) => {
    router.push(`/subscriptions/${id}`);
  };

  const handleCreateSubscription = () => {
    router.push('/subscriptions/new');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assinaturas</h1>
          <p className="text-muted-foreground">Gerencie assinaturas recorrentes</p>
        </div>
        <Button onClick={handleCreateSubscription}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Assinatura
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Assinaturas</CardTitle>
          <CardDescription>
            {data?.total ? `${data.total} assinatura${data.total !== 1 ? 's' : ''} encontrada${data.total !== 1 ? 's' : ''}` : 'Carregando...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionList
            subscriptions={data?.subscriptions || []}
            onViewDetails={handleViewDetails}
            isLoading={isLoading}
          />

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {data.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
