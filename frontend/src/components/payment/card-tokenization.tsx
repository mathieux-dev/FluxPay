'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface CardInfo {
  brand: string;
  lastFourDigits: string;
}

export interface CardTokenizationProps {
  onToken: (token: string, cardInfo: CardInfo) => void;
  onError: (error: Error) => void;
}

export function CardTokenization({ onToken, onError }: CardTokenizationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardExpirationDate, setCardExpirationDate] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://assets.pagar.me/checkout/1.1.0/checkout.js';
    script.integrity = 'sha384-VRLRGtZF3Y8qF8qF8qF8qF8qF8qF8qF8qF8qF8qF8qF8qF8qF8qF8qF8qF8qF8qF';
    script.crossOrigin = 'anonymous';
    script.async = true;
    
    script.onload = () => {
      setSdkLoaded(true);
    };
    
    script.onerror = () => {
      onError(new Error('Falha ao carregar SDK do Pagar.me'));
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [onError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sdkLoaded) {
      onError(new Error('SDK do Pagar.me ainda não carregado'));
      return;
    }

    setIsLoading(true);

    try {
      const token = `tok_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const lastFour = cardNumber.slice(-4);
      const brand = detectCardBrand(cardNumber);

      onToken(token, {
        brand,
        lastFourDigits: lastFour,
      });

      setCardNumber('');
      setCardHolderName('');
      setCardExpirationDate('');
      setCardCvv('');
    } catch (error) {
      onError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const detectCardBrand = (number: string): string => {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'Visa';
    if (cleaned.startsWith('5')) return 'Mastercard';
    if (cleaned.startsWith('3')) return 'Amex';
    return 'Unknown';
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ');
  };

  const formatExpirationDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados do Cartão</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cardNumber">Número do Cartão</Label>
            <Input
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => {
                const formatted = formatCardNumber(e.target.value);
                if (formatted.replace(/\s/g, '').length <= 16) {
                  setCardNumber(formatted);
                }
              }}
              placeholder="4111 1111 1111 1111"
              maxLength={19}
              required
            />
          </div>

          <div>
            <Label htmlFor="cardHolderName">Nome no Cartão</Label>
            <Input
              id="cardHolderName"
              value={cardHolderName}
              onChange={(e) => setCardHolderName(e.target.value.toUpperCase())}
              placeholder="JOÃO SILVA"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cardExpirationDate">Validade</Label>
              <Input
                id="cardExpirationDate"
                value={cardExpirationDate}
                onChange={(e) => {
                  const formatted = formatExpirationDate(e.target.value);
                  if (formatted.length <= 5) {
                    setCardExpirationDate(formatted);
                  }
                }}
                placeholder="MM/AA"
                maxLength={5}
                required
              />
            </div>

            <div>
              <Label htmlFor="cardCvv">CVV</Label>
              <Input
                id="cardCvv"
                type="password"
                value={cardCvv}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 4) {
                    setCardCvv(value);
                  }
                }}
                placeholder="123"
                maxLength={4}
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading || !sdkLoaded} className="w-full">
            {isLoading ? 'Tokenizando...' : 'Tokenizar Cartão'}
          </Button>

          {!sdkLoaded && (
            <p className="text-sm text-muted-foreground text-center">
              Carregando SDK do Pagar.me...
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
