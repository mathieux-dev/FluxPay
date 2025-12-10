'use client';

import { useState } from 'react';
import { AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUpdateMerchantStatus } from '@/lib/hooks/use-merchants';
import { useToast } from '@/hooks/use-toast';
import { Merchant } from '@/types/merchant';

interface MerchantStatusToggleProps {
  merchant: Merchant;
}

export function MerchantStatusToggle({ merchant }: MerchantStatusToggleProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);
  const { toast } = useToast();
  const updateStatus = useUpdateMerchantStatus();

  const handleToggle = (newStatus: boolean) => {
    setPendingStatus(newStatus);
    setShowConfirmDialog(true);
  };

  const confirmStatusChange = async () => {
    if (pendingStatus === null) return;

    try {
      await updateStatus.mutateAsync({
        id: merchant.id,
        active: pendingStatus,
      });

      toast({
        title: 'Status atualizado',
        description: `Merchant ${pendingStatus ? 'ativado' : 'desativado'} com sucesso`,
      });

      setShowConfirmDialog(false);
      setPendingStatus(null);
    } catch (error) {
      toast({
        title: 'Erro ao atualizar status',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const cancelStatusChange = () => {
    setShowConfirmDialog(false);
    setPendingStatus(null);
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">
          {merchant.active ? 'Ativo' : 'Inativo'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleToggle(!merchant.active)}
          disabled={updateStatus.isPending}
          className="p-1"
        >
          {merchant.active ? (
            <ToggleRight className="w-6 h-6 text-palmeiras-green" />
          ) : (
            <ToggleLeft className="w-6 h-6 text-muted-foreground" />
          )}
        </Button>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingStatus ? 'Ativar' : 'Desativar'} Merchant
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja {pendingStatus ? 'ativar' : 'desativar'} o merchant{' '}
              <strong>{merchant.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          {!pendingStatus && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> Ao desativar o merchant, todas as requisições de API
                serão rejeitadas. O merchant não poderá processar novos pagamentos até ser
                reativado.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={cancelStatusChange}>
              Cancelar
            </Button>
            <Button
              onClick={confirmStatusChange}
              disabled={updateStatus.isPending}
              variant={pendingStatus ? 'default' : 'destructive'}
            >
              {updateStatus.isPending
                ? 'Atualizando...'
                : pendingStatus
                ? 'Ativar'
                : 'Desativar'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}