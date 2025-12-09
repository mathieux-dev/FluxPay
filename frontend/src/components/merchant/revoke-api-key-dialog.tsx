'use client';

import { AlertTriangle, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRevokeAPIKey } from '@/lib/hooks/use-api-keys';
import { useToast } from '@/hooks/use-toast';
import { APIKey } from '@/types/api-key';

interface RevokeAPIKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: APIKey;
}

export function RevokeAPIKeyDialog({ open, onOpenChange, apiKey }: RevokeAPIKeyDialogProps) {
  const { mutate: revokeKey, isPending } = useRevokeAPIKey();
  const { toast } = useToast();

  const handleRevoke = () => {
    revokeKey(
      { keyId: apiKey.keyId },
      {
        onSuccess: () => {
          toast({
            title: 'API Key revogada',
            description: 'A chave foi desativada imediatamente.',
          });
          onOpenChange(false);
        },
        onError: (error) => {
          toast({
            title: 'Erro ao revogar API Key',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Revogar API Key
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. A chave será desativada imediatamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Key ID</label>
            <code className="block text-sm font-mono bg-muted px-3 py-2 rounded">
              {apiKey.keyId}
            </code>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>ATENÇÃO:</strong> Ao revogar esta chave, todas as requisições
              usando ela serão rejeitadas imediatamente. Certifique-se de que suas
              integrações não dependem mais desta chave antes de continuar.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={isPending}
            >
              {isPending ? 'Revogando...' : 'Revogar Chave'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
