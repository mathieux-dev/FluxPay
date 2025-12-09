'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';
import { PaymentForm } from '@/components/payment/payment-form';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function PublicPaymentPage() {
  const params = useParams();
  const linkId = params.linkId as string;
  const [paymentLink, setPaymentLink] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  useState(() => {
    const fetchPaymentLink = async () => {
      try {
        const response = await fetch(`${API_URL}/api/public/payment-links/${linkId}`);
        
        if (!response.ok) {
          throw new Error('Link de pagamento não encontrado ou expirado');
        }

        const data = await response.json();
        setPaymentLink(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar link de pagamento');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentLink();
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const handlePaymentSuccess = (id: string) => {
    setPaymentId(id);
    setPaymentSuccess(true);
  };

  const handlePaymentError = (error: Error) => {
    setError(error.message);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-palmeiras-green" />
            </div>
            <CardTitle>Pagamento Realizado!</CardTitle>
            <CardDescription>
              Seu pagamento foi processado com sucesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID do Pagamento:</span>
                <span className="font-mono text-sm">{paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor:</span>
                <span className="font-bold">{formatCurrency(paymentLink.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Descrição:</span>
                <span>{paymentLink.description}</span>
              </div>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Você receberá um email de confirmação em breve
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pagamento</CardTitle>
            <CardDescription>{paymentLink.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg">Valor a pagar:</span>
                <span className="text-2xl font-bold text-palmeiras-green">
                  {formatCurrency(paymentLink.amount)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <PaymentForm
          amount={paymentLink.amount / 100}
          description={paymentLink.description}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      </div>
    </div>
  );
}
