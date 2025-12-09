'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentLinkDetails } from '@/components/merchant/payment-link-details';
import { usePaymentLink } from '@/lib/hooks/use-payment-links';

export default function PaymentLinkDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: paymentLink, isLoading } = usePaymentLink(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!paymentLink) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Link de pagamento não encontrado</p>
        <Button
          variant="outline"
          onClick={() => router.push('/payment-links')}
          className="mt-4"
        >
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/payment-links')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Detalhes do Link</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie seu link de pagamento
          </p>
        </div>
      </div>

      <PaymentLinkDetails paymentLink={paymentLink} />
    </div>
  );
}
