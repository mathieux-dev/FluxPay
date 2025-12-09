'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addDays } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCreatePaymentLink } from '@/lib/hooks/use-payment-links';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  amount: z.string().min(1, 'Valor é obrigatório').refine(
    (val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num > 0;
    },
    'Valor deve ser maior que zero'
  ),
  description: z.string().min(1, 'Descrição é obrigatória').max(200, 'Descrição muito longa'),
  expiresAt: z.date({
    required_error: 'Data de expiração é obrigatória',
  }),
});

type FormData = z.infer<typeof formSchema>;

interface CreatePaymentLinkDialogProps {
  children: React.ReactNode;
}

export function CreatePaymentLinkDialog({ children }: CreatePaymentLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate: createPaymentLink, isPending } = useCreatePaymentLink();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      description: '',
      expiresAt: addDays(new Date(), 7),
    },
  });

  const onSubmit = (data: FormData) => {
    const amountInCents = Math.round(parseFloat(data.amount.replace(',', '.')) * 100);

    createPaymentLink(
      {
        amount: amountInCents,
        description: data.description,
        expiresAt: data.expiresAt.toISOString(),
      },
      {
        onSuccess: () => {
          toast({
            title: 'Link criado com sucesso',
            description: 'O link de pagamento foi criado e está pronto para uso.',
          });
          setOpen(false);
          form.reset();
        },
        onError: (error) => {
          toast({
            title: 'Erro ao criar link',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Link de Pagamento</DialogTitle>
          <DialogDescription>
            Crie um link de pagamento único para compartilhar com seus clientes
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="100.00"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d,]/g, '');
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>Valor em reais (ex: 100.00)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição do pagamento"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Descreva o que o cliente está pagando
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Expiração</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'dd/MM/yyyy')
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    O link expirará nesta data
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-palmeiras-green hover:bg-palmeiras-green-light"
                disabled={isPending}
              >
                {isPending ? 'Criando...' : 'Criar Link'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
