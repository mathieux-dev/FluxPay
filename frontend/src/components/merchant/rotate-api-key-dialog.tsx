'use client';

import { useState } from 'react';
import { Copy, Check, AlertTriangle, RotateCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useRotateAPIKey } from '@/lib/hooks/use-api-keys';
import { useToast } from '@/hooks/use-toast';
import { APIKey } from '@/types/api-key';
import { RotateAPIKeyResponse } from '@/types/api-key';

interface RotateAPIKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: APIKey;
}

export function RotateAPIKeyDialog({ open, onOpenChange, apiKey }: RotateAPIKeyDialogProps) {
  const [rotatedKey, setRotatedKey] = useState<RotateAPIKeyResponse | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const { mutate: rotateKey, isPending } = useRotateAPIKey();
  const { toast } = useToast();

  const handleRotate = () => {
    rotateKey(
      { keyId: apiKey.keyId },
      {
        onSuccess: (data) => {
          setRotatedKey(data);
          toast({
            title: 'API Key rotacionada!',
            description: 'Nova chave criada. A antiga será desativada na data de expiração.',
          });
        },
        onError: (error) => {
          toast({
            title: 'Erro ao rotacionar API Key',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleCopySecret = async () => {
    if (rotatedKey) {
      await navigator.clipboard.writeText(rotatedKey.newKeySecret);
      setCopiedSecret(true);
      toast({
        title: 'Copiado!',
        description: 'Secret copiado para a área de transferência',
      });
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleClose = () => {
    setRotatedKey(null);
    setCopiedSecret(false);
    onOpenChange(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {rotatedKey ? 'API Key Rotacionada' : 'Rotacionar API Key'}
          </DialogTitle>
          <DialogDescription>
            {rotatedKey
              ? 'Nova chave criada com sucesso. Copie o secret agora.'
              : 'Uma nova chave será criada e a antiga será marcada para expiração.'}
          </DialogDescription>
        </DialogHeader>

        {!rotatedKey ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Key ID Atual</label>
              <code className="block text-sm font-mono bg-muted px-3 py-2 rounded">
                {apiKey.keyId}
              </code>
            </div>

            <Alert>
              <RotateCw className="h-4 w-4" />
              <AlertDescription>
                Ao rotacionar, uma nova chave será criada e a chave atual será marcada
                para deprecação. Você terá um período de transição para atualizar suas
                integrações antes que a chave antiga expire.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleRotate} disabled={isPending}>
                {isPending ? 'Rotacionando...' : 'Rotacionar'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-4 p-4 border rounded-lg bg-green-50 dark:bg-green-950">
              <div className="flex items-center gap-2">
                <Badge variant="default">Nova Chave</Badge>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Key ID</label>
                <code className="block text-sm font-mono bg-white dark:bg-gray-900 px-3 py-2 rounded">
                  {rotatedKey.newKeyId}
                </code>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Secret</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono bg-white dark:bg-gray-900 px-3 py-2 rounded break-all">
                    {rotatedKey.newKeySecret}
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
            </div>

            <div className="space-y-4 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Chave Antiga (Deprecada)</Badge>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Key ID</label>
                <code className="block text-sm font-mono bg-white dark:bg-gray-900 px-3 py-2 rounded">
                  {apiKey.keyId}
                </code>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Expira em</label>
                <p className="text-sm text-muted-foreground">
                  {formatDate(rotatedKey.oldKeyExpiresAt)}
                </p>
              </div>
            </div>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>IMPORTANTE:</strong> O secret da nova chave não poderá ser
                recuperado após fechar esta janela. Atualize suas integrações antes
                que a chave antiga expire.
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
