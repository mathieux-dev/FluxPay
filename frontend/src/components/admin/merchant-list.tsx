'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, MoreHorizontal } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useMerchants } from '@/lib/hooks/use-merchants';
import { MerchantFilters } from '@/types/merchant';

interface MerchantListProps {
  filters: MerchantFilters;
}

export function MerchantList({ filters }: MerchantListProps) {
  const router = useRouter();
  const { data, isLoading, error } = useMerchants(filters);
  const [currentPage, setCurrentPage] = useState(1);

  const handleViewDetails = (merchantId: string) => {
    router.push(`/admin/merchants/${merchantId}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount / 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Erro ao carregar merchants: {error.message}
        </p>
      </div>
    );
  }

  if (!data?.merchants.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum merchant encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Volume Total</TableHead>
            <TableHead>Transações</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="w-[70px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.merchants.map((merchant) => (
            <TableRow key={merchant.id}>
              <TableCell className="font-medium">{merchant.name}</TableCell>
              <TableCell>{merchant.email}</TableCell>
              <TableCell>
                <Badge variant={merchant.active ? 'default' : 'secondary'}>
                  {merchant.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell>{formatCurrency(merchant.totalVolume)}</TableCell>
              <TableCell>{merchant.transactionCount.toLocaleString('pt-BR')}</TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(merchant.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewDetails(merchant.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver detalhes
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {data.merchants.length} de {data.total} merchants
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {currentPage} de {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(data.totalPages, currentPage + 1))}
              disabled={currentPage === data.totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}