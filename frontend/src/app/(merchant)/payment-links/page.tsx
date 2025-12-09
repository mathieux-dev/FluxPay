'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentLinkList } from '@/components/merchant/payment-link-list';
import { PaymentLinkPagination } from '@/components/merchant/payment-link-pagination';
import { CreatePaymentLinkDialog } from '@/components/merchant/create-payment-link-dialog';
import { usePaymentLinks } from '@/lib/hooks/use-payment-links';

export default function PaymentLinksPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePaymentLinks(page);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Links de Pagamento</h1>
          <p className="text-muted-foreground">
            Crie e gerencie links de pagamento para seus clientes
          </p>
        </div>
        <CreatePaymentLinkDialog>
          <Button className="bg-palmeiras-green hover:bg-palmeiras-green-light">
            <Plus className="h-4 w-4 mr-2" />
            Criar Link
          </Button>
        </CreatePaymentLinkDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seus Links de Pagamento</CardTitle>
          <CardDescription>
            {data?.total || 0} link(s) de pagamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <PaymentLinkList
              paymentLinks={data?.paymentLinks || []}
              isLoading={isLoading}
            />
            {data && data.totalPages > 1 && (
              <PaymentLinkPagination
                currentPage={page}
                totalPages={data.totalPages}
                onPageChange={setPage}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
