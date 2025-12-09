'use client';

import { useRouter } from 'next/navigation';
import { CreateSubscriptionForm } from '@/components/merchant/create-subscription-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function NewSubscriptionPage() {
  const router = useRouter();
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  const handleSuccess = (id: string) => {
    setSubscriptionId(id);
    setTimeout(() => {
      router.push(`/subscriptions/${id}`);
    }, 2000);
  };

  const handleCancel = () => {
    router.push('/subscriptions');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nova Assinatura</h1>
        <p className="text-muted-foreground">Crie uma nova assinatura recorrente</p>
      </div>

      {subscriptionId ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Assinatura Criada com Sucesso
            </CardTitle>
            <CardDescription>
              ID da Assinatura: {subscriptionId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Redirecionando para os detalhes da assinatura...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <CreateSubscriptionForm onSuccess={handleSuccess} onCancel={handleCancel} />
      )}
    </div>
  );
}
