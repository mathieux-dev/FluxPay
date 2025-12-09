'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSubscription } from '@/lib/hooks/use-subscriptions';
import { SubscriptionDetailsComponent } from '@/components/merchant/subscription-details';
import { CancelSubscriptionDialog } from '@/components/merchant/cancel-subscription-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

export default function SubscriptionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;
  const { data: subscription, isLoading, error } = useSubscription(id);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/subscriptions')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar assinatura. Por favor, tente novamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleCancelSuccess = () => {
    toast({
      title: 'Assinatura cancelada',
      description: 'A assinatura foi cancelada com sucesso.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/subscriptions')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Detalhes da Assinatura</h1>
            <p className="text-muted-foreground">{subscription.customerName}</p>
          </div>
        </div>
        {subscription.status === 'active' && (
          <Button
            variant="destructive"
            onClick={() => setCancelDialogOpen(true)}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancelar Assinatura
          </Button>
        )}
      </div>

      <SubscriptionDetailsComponent subscription={subscription} />

      <CancelSubscriptionDialog
        subscriptionId={subscription.id}
        customerName={subscription.customerName}
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onSuccess={handleCancelSuccess}
      />
    </div>
  );
}
