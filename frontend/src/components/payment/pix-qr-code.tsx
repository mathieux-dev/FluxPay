'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

export interface PIXQRCodeProps {
  qrCode: string;
  qrCodeText: string;
  expiresAt: string;
  onCopy: () => void;
}

export function PIXQRCode({ qrCode, qrCodeText, expiresAt, onCopy }: PIXQRCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeText);
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagamento PIX</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-4 rounded-lg">
            <QRCodeSVG value={qrCode} size={256} />
          </div>
          
          <div className="w-full space-y-2">
            <p className="text-sm font-medium">Código PIX Copia e Cola:</p>
            <div className="bg-muted p-3 rounded text-xs break-all">
              {qrCodeText}
            </div>
          </div>

          <Button onClick={handleCopy} className="w-full" variant={copied ? 'outline' : 'default'}>
            {copied ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copiar código PIX
              </>
            )}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Expira em: {format(new Date(expiresAt), 'dd/MM/yyyy HH:mm')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
