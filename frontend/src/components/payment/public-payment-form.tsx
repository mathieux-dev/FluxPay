'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, QrCode, FileText, Loader2 } from 'lucide-react';
import { CardTokenization, CardInfo } from './card-tokenization';
import { PIXQRCode } from './pix-qr-code';
import { BoletoDisplay } from './boleto-display';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export type PaymentMethod = 'card' | 'pix' | 'boleto';

export interface PublicPaymentFormProps {
  linkId: string;
  amount: number;
  description: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: Error) => void;
}

interface PaymentResult {
  id: string;
  status: string;
  qrCode?: string;
  qrCodeText?: string;
  boletoBarcode?: string;
  boletoPdfUrl?: string;
  expiresAt?: string;
}

export function PublicPaymentForm({ linkId, amount, description, onSuccess, onError }: PublicPaymentFormProps) {
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [isLoading, setIsLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [cardToken, setCardToken] = useState<string | null>(null);
  const [cardInfo, setCardInfo] = useState<CardInfo | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCardToken = (token: string, info: CardInfo) => {
    setCardToken(token);
    setCardInfo(info);
    setError(null);
  };

  const handleCardError = (err: Error) => {
    setError(err.message);
    onError(err);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (method === 'card' && !cardToken) {
      setError('Por favor, tokenize o cartão primeiro');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: any = {
        linkId,
        method,
        customer: {
          name: customerName,
          email: customerEmail,
          document: customerDocument,
        },
      };

      if (method === 'card' && cardToken) {
        payload.card = { token: cardToken };
      }

      const response = await fetch(`${API_URL}/api/payment-links/${linkId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao processar pagamento');
      }

      const result: PaymentResult = await response.json();
      
      if (method === 'card' && result.status === 'paid') {
        onSuccess(result.id);
      } else if (method === 'pix' || method === 'boleto') {
        setPaymentResult(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar pagamento';
      setError(errorMessage);
      onError(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    // Toast notification would go here
    console.log('Copied to clipboard');
  };

  if (paymentResult && method === 'pix' && paymentResult.qrCode) {
    return (
      <PIXQRCode
        qrCode={paymentResult.qrCode}
        qrCodeText={paymentResult.qrCodeText || ''}
        expiresAt={paymentResult.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()}
        onCopy={handleCopy}
      />
    );
  }

  if (paymentResult && method === 'boleto' && paymentResult.boletoBarcode) {
    return (
      <BoletoDisplay
        boletoBarcode={paymentResult.boletoBarcode}
        boletoPdfUrl={paymentResult.boletoPdfUrl || ''}
        expiresAt={paymentResult.expiresAt || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()}
        onCopy={handleCopy}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escolha o método de pagamento</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={method} onValueChange={(value) => setMethod(value as PaymentMethod)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="card">
              <CreditCard className="mr-2 h-4 w-4" />
              Cartão
            </TabsTrigger>
            <TabsTrigger value="pix">
              <QrCode className="mr-2 h-4 w-4" />
              PIX
            </TabsTrigger>
            <TabsTrigger value="boleto">
              <FileText className="mr-2 h-4 w-4" />
              Boleto
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmitPayment} className="mt-6 space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Dados do Pagador</h4>
              
              <div>
                <Label htmlFor="customerName">Nome Completo</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="João Silva"
                  required
                />
              </div>

              <div>
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="joao@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="customerDocument">CPF/CNPJ</Label>
                <Input
                  id="customerDocument"
                  value={customerDocument}
                  onChange={(e) => setCustomerDocument(e.target.value)}
                  placeholder="123.456.789-09"
                  required
                />
              </div>
            </div>

            <TabsContent value="card" className="space-y-4">
              <CardTokenization onToken={handleCardToken} onError={handleCardError} />
              
              {cardInfo && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">
                    Cartão tokenizado: {cardInfo.brand} •••• {cardInfo.lastFourDigits}
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="pix">
              <Alert>
                <QrCode className="h-4 w-4" />
                <AlertDescription>
                  Após confirmar, você receberá um QR Code para realizar o pagamento via PIX.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="boleto">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Após confirmar, você receberá um boleto bancário para pagamento.
                </AlertDescription>
              </Alert>
            </TabsContent>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              disabled={isLoading || (method === 'card' && !cardToken)} 
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                `Pagar R$ ${(amount / 100).toFixed(2)}`
              )}
            </Button>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}
