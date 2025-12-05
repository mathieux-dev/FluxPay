'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export type PaymentMethod = 'card' | 'pix' | 'boleto';

export interface PaymentFormProps {
  onSuccess: (paymentId: string, result: any) => void;
  onError: (error: Error) => void;
  amount?: number;
  description?: string;
}

export function PaymentForm({ onSuccess, onError, amount: initialAmount, description: initialDescription }: PaymentFormProps) {
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [amount, setAmount] = useState(initialAmount?.toString() || '');
  const [description, setDescription] = useState(initialDescription || '');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const amountInCents = Math.round(parseFloat(amount) * 100);
      
      const payload = {
        amount: amountInCents,
        method,
        description,
        customer: {
          name: customerName,
          email: customerEmail,
          document: customerDocument,
        },
      };

      onSuccess('test-payment-id', payload);
    } catch (error) {
      onError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Pagamento de Teste</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do pagamento"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="method">Método de Pagamento</Label>
            <Select value={method} onValueChange={(value) => setMethod(value as PaymentMethod)}>
              <SelectTrigger id="method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Cartão de Crédito</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Dados do Cliente</h4>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="customerName">Nome</Label>
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
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Processando...' : 'Criar Pagamento'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
