'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Copy, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateMerchant } from '@/lib/hooks/use-merchants';
import { useToast } from '@/hooks/use-toast';

const createMerchantSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  pagarmeApiKey: z.string().optional(),
  gerencianetClientId: z.string().optional(),
  gerencianetClientSecret: z.string().optional(),
});

type CreateMerchantForm = z.infer<typeof createMerchantSchema>;

interface CreateMerchantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateMerchantDialog({ open, onOpenChange }: CreateMerchantDialogProps) {
  const [showCredentials, setShowCredentials] = useState(false);
  const [createdMerchant, setCreatedMerchant] = useState<{
    merchant: any;
    apiKey: string;
    apiSecret: string;
  } | null>(null);
  const { toast } = useToast();
  const createMerchant = useCreateMerchant();

  const form = useForm<CreateMerchantForm>({
    resolver: zodResolver(createMerchantSchema),
    defaultValues: {
      name: '',
      email: '',
      pagarmeApiKey: '',
      gerencianetClientId: '',
      gerencianetClientSecret: '',
    },
  });

  const onSubmit = async (data: CreateMerchantForm) => {
    try {
      const result = await createMerchant.mutateAsync(data);
      setCreatedMerchant(result);
      form.reset();
      toast({
        title: 'Merchant criado com sucesso',
        description: 'As credenciais foram geradas. Salve-as em local seguro.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao criar merchant',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setCreatedMerchant(null);
    setShowCredentials(false);
    form.reset();
    onOpenChange(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'Texto copiado para a área de transferência',
    });
  };

  if (createdMerchant) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Merchant Criado com Sucesso</DialogTitle>
            <DialogDescription>
              Salve estas credenciais em local seguro. Elas não poderão ser recuperadas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>Importante:</strong> As credenciais abaixo serão exibidas apenas uma vez.
                Certifique-se de salvá-las em local seguro antes de fechar esta janela.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Merchant ID</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input value={createdMerchant.merchant.id} readOnly />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(createdMerchant.merchant.id)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">API Key</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input value={createdMerchant.apiKey} readOnly />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(createdMerchant.apiKey)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">API Secret</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    type={showCredentials ? 'text' : 'password'}
                    value={createdMerchant.apiSecret}
                    readOnly
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCredentials(!showCredentials)}
                  >
                    {showCredentials ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(createdMerchant.apiSecret)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose}>Fechar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Novo Merchant</DialogTitle>
          <DialogDescription>
            Preencha os dados do merchant e configure os provedores de pagamento.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do merchant" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Configuração de Provedores</h3>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="pagarmeApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pagar.me API Key (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="pk_test_..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gerencianetClientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gerencianet Client ID (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Client_Id_..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gerencianetClientSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gerencianet Client Secret (opcional)</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Client_Secret_..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMerchant.isPending}>
                {createMerchant.isPending ? 'Criando...' : 'Criar Merchant'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}