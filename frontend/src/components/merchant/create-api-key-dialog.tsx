'use client';

import { useState } from 'react';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateAPIKey } from '@/lib/hooks/use-api-keys';
import { useToast } from '@/hooks/use-toast';
import { CreateAPIKeyResponse } from '@/types/api-key';

interface CreateAPIKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAPIKeyDialog({ open, onOpenChange }: CreateAPIKeyDialogProps) {
  const [createdKey, setCreatedKey] = useState<CreateAPIKeyResponse | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const { mutate: createKey, isPending } = useCreateAPIKey();
  const { toast } = useToast();

  const handleCreate = () => {
    createKey({}, {
      onSuccess: (data) => {
        setCreatedKey(data);
        toast({
          title: 'API Key criada!',
          description: 'Copie o secret agora, ele não será exibido novamente.',
        });
      },
      onError: (error) => {
        toast({
          title: 'Erro ao criar API Key',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  const handleCopySecret = async () => {
    if (createdKey) {
      await navigator.clipboard.writeText(createdKey.keySecret);
      setCopiedSecret(true);
      toast({
        title: 'Copiado!',
        description: 'Secret copiado para a área de transferência',
      });
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleClose = () => {
    setCreatedKey(null);
    setCopiedSecret(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {createdKey ? 'API Key Criada' : 'Criar Nova API Key'}
          </DialogTitle>
          <DialogDescription>
            {createdKey
              ? 'Copie o secret agora. Por segurança, ele não será exibido novamente.'
              : 'Uma nova chave de API será gerada para integração com o FluxPay.'}
          </DialogDescription>
        </DialogHeader>

        {!createdKey ? (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                O secret da API key será exibido apenas uma vez. Certifique-se de copiá-lo
                e armazená-lo em um local seguro.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isPending}>
                {isPending ? 'Criando...' : 'Criar API Key'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Key ID</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono bg-muted px-3 py-2 rounded">
                  {createdKey.keyId}
                </code>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Secret</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono bg-muted px-3 py-2 rounded break-all">
                  {createdKey.keySecret}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopySecret}
                >
                  {copiedSecret ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {createdKey.expiresAt && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Expira em</label>
                <p className="text-sm text-muted-foreground">
                  {new Date(createdKey.expiresAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>IMPORTANTE:</strong> Este secret não poderá ser recuperado após
                fechar esta janela. Certifique-se de copiá-lo agora.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button onClick={handleClose}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
