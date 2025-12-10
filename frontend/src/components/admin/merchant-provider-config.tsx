'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUpdateMerchantProviders } from '@/lib/hooks/use-merchants';
import { useToast } from '@/hooks/use-toast';
import { Merchant } from '@/types/merchant';

const providerConfigSchema = z.object({
  pagarmeApiKey: z.string().optional(),
  gerencianetClientId: z.string().optional(),
  gerencianetClientSecret: z.string().optional(),
  sandboxMode: z.boolean().default(false),
});

type ProviderConfigForm = z.infer<typeof providerConfigSchema>;

interface MerchantProviderConfigProps {
  merchant: Merchant;
}

export function MerchantProviderConfig({ merchant }: MerchantProviderConfigProps) {
  const [showSecrets, setShowSecrets] = useState(false);
  const { toast } = useToast();
  const updateProviders = useUpdateMerchantProviders();

  const form = useForm<ProviderConfigForm>({
    resolver: zodResolver(providerConfigSchema),
    defaultValues: {
      pagarmeApiKey: merchant.providerConfig?.pagarme?.apiKey ? '••••••••' : '',
      gerencianetClientId: merchant.providerConfig?.gerencianet?.clientId ? '••••••••' : '',
      gerencianetClientSecret: merchant.providerConfig?.gerencianet?.clientSecret ? '••••••••' : '',
      sandboxMode: merchant.providerConfig?.pagarme?.sandbox || merchant.providerConfig?.gerencianet?.sandbox || false,
    },
  });

  const onSubmit = async (data: ProviderConfigForm) => {
    try {
      // Only send fields that have been changed (not masked)
      const updateData: any = {
        sandboxMode: data.sandboxMode,
      };

      if (data.pagarmeApiKey && data.pagarmeApiKey !== '••••••••') {
        updateData.pagarmeApiKey = data.pagarmeApiKey;
      }

      if (data.gerencianetClientId && data.gerencianetClientId !== '••••••••') {
        updateData.gerencianetClientId = data.gerencianetClientId;
      }

      if (data.gerencianetClientSecret && data.gerencianetClientSecret !== '••••••••') {
        updateData.gerencianetClientSecret = data.gerencianetClientSecret;
      }

      await updateProviders.mutateAsync({
        id: merchant.id,
        providers: updateData,
      });

      toast({
        title: 'Configuração atualizada',
        description: 'Configuração dos provedores atualizada com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar configuração',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const maskCredential = (credential: string | undefined) => {
    if (!credential) return '';
    if (credential.length <= 8) return '••••••••';
    return credential.slice(0, 4) + '••••' + credential.slice(-4);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          <strong>Segurança:</strong> As credenciais são criptografadas antes de serem enviadas
          ao backend. Apenas os últimos 4 caracteres são exibidos para identificação.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="sandbox-mode"
                checked={form.watch('sandboxMode')}
                onCheckedChange={(checked) => form.setValue('sandboxMode', checked)}
              />
              <Label htmlFor="sandbox-mode">Modo Sandbox</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSecrets(!showSecrets)}
              >
                {showSecrets ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Mostrar
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Pagar.me</span>
                  {merchant.providerConfig?.pagarme && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Configurado
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="pagarmeApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input
                          type={showSecrets ? 'text' : 'password'}
                          placeholder="pk_test_..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      {merchant.providerConfig?.pagarme?.apiKey && (
                        <p className="text-xs text-muted-foreground">
                          Atual: {maskCredential(merchant.providerConfig.pagarme.apiKey)}
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Gerencianet</span>
                  {merchant.providerConfig?.gerencianet && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Configurado
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="gerencianetClientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client ID</FormLabel>
                      <FormControl>
                        <Input
                          type={showSecrets ? 'text' : 'password'}
                          placeholder="Client_Id_..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      {merchant.providerConfig?.gerencianet?.clientId && (
                        <p className="text-xs text-muted-foreground">
                          Atual: {maskCredential(merchant.providerConfig.gerencianet.clientId)}
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gerencianetClientSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Secret</FormLabel>
                      <FormControl>
                        <Input
                          type={showSecrets ? 'text' : 'password'}
                          placeholder="Client_Secret_..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      {merchant.providerConfig?.gerencianet?.clientSecret && (
                        <p className="text-xs text-muted-foreground">
                          Atual: {maskCredential(merchant.providerConfig.gerencianet.clientSecret)}
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateProviders.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {updateProviders.isPending ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}