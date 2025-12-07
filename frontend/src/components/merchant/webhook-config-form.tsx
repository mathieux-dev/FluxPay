'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  useWebhookConfig, 
  useCreateWebhookConfig, 
  useUpdateWebhookConfig,
  useGenerateWebhookSecret 
} from '@/lib/hooks/use-webhooks';

const webhookSchema = z.object({
  url: z.string().url('URL inválida').min(1, 'URL é obrigatória'),
});

type WebhookFormData = z.infer<typeof webhookSchema>;

export function WebhookConfigForm() {
  const { toast } = useToast();
  const [showSecret, setShowSecret] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  
  const { data: config, isLoading } = useWebhookConfig();
  const createConfig = useCreateWebhookConfig();
  const updateConfig = useUpdateWebhookConfig();
  const generateSecret = useGenerateWebhookSecret();
  
  const { register, handleSubmit, formState: { errors } } = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      url: config?.url || '',
    },
    values: config ? { url: config.url } : undefined,
  });
  
  const onSubmit = async (data: WebhookFormData) => {
    try {
      if (config) {
        await updateConfig.mutateAsync(data);
        toast({ title: 'Webhook atualizado com sucesso' });
      } else {
        const result = await createConfig.mutateAsync(data);
        setNewSecret(result.secret);
        toast({ title: 'Webhook criado com sucesso' });
      }
    } catch (error) {
      toast({ 
        title: 'Erro ao salvar webhook', 
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive' 
      });
    }
  };
  
  const handleGenerateSecret = async () => {
    try {
      const result = await generateSecret.mutateAsync();
      setNewSecret(result.secret);
      toast({ title: 'Novo secret gerado com sucesso' });
    } catch (error) {
      toast({ 
        title: 'Erro ao gerar secret', 
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive' 
      });
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado para área de transferência' });
  };
  
  if (isLoading) {
    return <div>Carregando...</div>;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de Webhook</CardTitle>
        <CardDescription>
          Configure o endpoint que receberá notificações de pagamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL do Webhook</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://seu-site.com/webhooks/fluxpay"
              {...register('url')}
            />
            {errors.url && (
              <p className="text-sm text-red-600">{errors.url.message}</p>
            )}
          </div>
          
          <Button 
            type="submit" 
            disabled={createConfig.isPending || updateConfig.isPending}
          >
            {config ? 'Atualizar URL' : 'Salvar Configuração'}
          </Button>
        </form>
        
        {config && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Webhook Secret</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateSecret}
                    disabled={generateSecret.isPending}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Input
                  type={showSecret ? 'text' : 'password'}
                  value={newSecret || config.secret}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(newSecret || config.secret)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {newSecret && (
              <Alert>
                <AlertDescription>
                  <strong>Importante:</strong> Este é o único momento em que você verá este secret. 
                  Salve-o em um local seguro. Você precisará dele para verificar a assinatura dos webhooks.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
