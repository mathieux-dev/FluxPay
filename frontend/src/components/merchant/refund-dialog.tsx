'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRefundTransaction } from '@/lib/hooks/use-transactions';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface RefundDialogProps {
  transactionId: string;
  transactionAmount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RefundDialog({
  transactionId,
  transactionAmount,
  open,
  onOpenChange,
}: RefundDialogProps) {
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [partialAmount, setPartialAmount] = useState('');
  const { toast } = useToast();
  const { mutate: refund, isPending } = useRefundTransaction();

  const handleRefund = () => {
    const amount = refundType === 'full' ? undefined : parseFloat(partialAmount) * 100;

    if (refundType === 'partial') {
      if (!partialAmount || parseFloat(partialAmount) <= 0) {
        toast({
          title: 'Erro',
          description: 'Informe um valor válido para o reembolso parcial',
          variant: 'destructive',
        });
        return;
      }

      if (parseFloat(partialAmount) * 100 > transactionAmount) {
        toast({
          title: 'Erro',
          description: 'O valor do reembolso não pode ser maior que o valor da transação',
          variant: 'destructive',
        });
        return;
      }
    }

    refund(
      { id: transactionId, amount },
      {
        onSuccess: () => {
          toast({
            title: 'Reembolso processado',
            description: 'O reembolso foi processado com sucesso',
          });
          onOpenChange(false);
          setPartialAmount('');
          setRefundType('full');
        },
        onError: (error) => {
          toast({
            title: 'Erro ao processar reembolso',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reembolsar Transação</DialogTitle>
          <DialogDescription>
            Escolha o tipo de reembolso que deseja processar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Valor da Transação</Label>
            <p className="text-2xl font-bold">{formatCurrency(transactionAmount)}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="full"
                name="refundType"
                value="full"
                checked={refundType === 'full'}
                onChange={() => setRefundType('full')}
                className="h-4 w-4 text-palmeiras-green"
              />
              <Label htmlFor="full" className="cursor-pointer">
                Reembolso Total ({formatCurrency(transactionAmount)})
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="partial"
                name="refundType"
                value="partial"
                checked={refundType === 'partial'}
                onChange={() => setRefundType('partial')}
                className="h-4 w-4 text-palmeiras-green"
              />
              <Label htmlFor="partial" className="cursor-pointer">
                Reembolso Parcial
              </Label>
            </div>

            {refundType === 'partial' && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="partialAmount">Valor do Reembolso (R$)</Label>
                <Input
                  id="partialAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={transactionAmount / 100}
                  placeholder="0.00"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Máximo: {formatCurrency(transactionAmount)}
                </p>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Atenção:</strong> Esta ação não pode ser desfeita. O valor será devolvido ao
              cliente e a transação será marcada como reembolsada.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleRefund}
            disabled={isPending}
            className="bg-palmeiras-green hover:bg-palmeiras-green-light"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Reembolso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
