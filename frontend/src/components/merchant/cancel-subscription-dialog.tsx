'use client';

import { useState } from 'react';
import { useCancelSubscription } from '@/lib/hooks/use-subscriptions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';

interface CancelSubscriptionDialogProps {
  subscriptionId: string;
  customerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CancelSubscriptionDialog({
  subscriptionId,
  customerName,
  open,
  onOpenChange,
  onSuccess,
}: CancelSubscriptionDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const { mutate: cancelSubscription, isPending } = useCancelSubscription();

  const handleCancel = () => {
    setError(null);
    cancelSubscription(subscriptionId, {
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
      },
      onError: (err) => {
        setError(err.message);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Cancelar Assinatura
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja cancelar a assinatura de <strong>{customerName}</strong>?
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertDescription>
            Esta ação não pode ser desfeita. A assinatura será cancelada imediatamente e não haverá mais cobranças.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Não, manter assinatura
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sim, cancelar assinatura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
