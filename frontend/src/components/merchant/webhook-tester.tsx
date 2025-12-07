'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTestWebhook } from '@/lib/hooks/use-webhooks';
import { WebhookTestResponse } from '@/types/webhook';

export function WebhookTester() {
  const { toast } = useToast();
  const [result, setResult] = useState<WebhookTestResponse | null>(null);
  const testWebhook = useTestWebhook();
  
  const handleTest = async () => {
    try {
      const data = await testWebhook.mutateAsync({});
      setResult(data);
      
      if (data.success) {
        toast({ title: 'Webhook enviado com sucesso' });
      } else {
        toast({ 
          title: 'Webhook falhou', 
          description: `Status: ${data.statusCode}`,
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ 
        title: 'Erro ao testar webhook', 
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive' 
      });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Testar Webhook</CardTitle>
        <CardDescription>
          Envie um webhook de teste para verificar sua configuração
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleTest} 
          disabled={testWebhook.isPending}
          className="w-full sm:w-auto"
        >
          <Send className="mr-2 h-4 w-4" />
          {testWebhook.isPending ? 'Enviando...' : 'Enviar Webhook de Teste'}
        </Button>
        
        {result && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Label>Status</Label>
              <Badge variant={result.success ? 'default' : 'destructive'}>
                {result.success ? (
                  <CheckCircle className="mr-1 h-3 w-3" />
                ) : (
                  <XCircle className="mr-1 h-3 w-3" />
                )}
                {result.statusCode}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <Label>Payload Enviado</Label>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-48">
                {JSON.stringify(result.payload, null, 2)}
              </pre>
            </div>
            
            <div className="space-y-2">
              <Label>Headers Enviados</Label>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-32">
                {JSON.stringify(result.headers, null, 2)}
              </pre>
            </div>
            
            <div className="space-y-2">
              <Label>Resposta</Label>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-48">
                {JSON.stringify(result.response, null, 2)}
              </pre>
            </div>
            
            {!result.success && (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Dica:</strong> Verifique se sua URL está acessível e se está retornando 
                  status 200. Certifique-se de que seu servidor está validando a assinatura corretamente.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
