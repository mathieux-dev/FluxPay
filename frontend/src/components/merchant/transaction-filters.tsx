'use client';

import { useState } from 'react';
import { type TransactionFilters, PaymentStatus, PaymentMethod } from '@/types/transaction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TransactionFiltersProps {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
}

const statusOptions: { value: PaymentStatus; label: string }[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'authorized', label: 'Autorizado' },
  { value: 'paid', label: 'Pago' },
  { value: 'refunded', label: 'Reembolsado' },
  { value: 'failed', label: 'Falhou' },
  { value: 'expired', label: 'Expirado' },
  { value: 'cancelled', label: 'Cancelado' },
];

const methodOptions: { value: PaymentMethod; label: string }[] = [
  { value: 'card', label: 'Cartão' },
  { value: 'pix', label: 'PIX' },
  { value: 'boleto', label: 'Boleto' },
];

export function TransactionFilters({ filters, onChange }: TransactionFiltersProps) {
  const [search, setSearch] = useState(filters.search || '');
  const [dateFrom, setDateFrom] = useState(filters.dateRange?.from || '');
  const [dateTo, setDateTo] = useState(filters.dateRange?.to || '');

  const handleStatusToggle = (status: PaymentStatus) => {
    const currentStatus = filters.status || [];
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter((s) => s !== status)
      : [...currentStatus, status];
    
    onChange({ ...filters, status: newStatus.length > 0 ? newStatus : undefined, page: 1 });
  };

  const handleMethodToggle = (method: PaymentMethod) => {
    const currentMethod = filters.method || [];
    const newMethod = currentMethod.includes(method)
      ? currentMethod.filter((m) => m !== method)
      : [...currentMethod, method];
    
    onChange({ ...filters, method: newMethod.length > 0 ? newMethod : undefined, page: 1 });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({ ...filters, search: search || undefined, page: 1 });
  };

  const handleDateRangeApply = () => {
    if (dateFrom || dateTo) {
      onChange({
        ...filters,
        dateRange: { from: dateFrom, to: dateTo },
        page: 1,
      });
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    onChange({ page: 1, limit: filters.limit });
  };

  const hasActiveFilters = 
    filters.status?.length || 
    filters.method?.length || 
    filters.search || 
    filters.dateRange;

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="search" className="sr-only">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Buscar por ID ou email do cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Button type="submit" className="bg-palmeiras-green hover:bg-palmeiras-green-light">
            Buscar
          </Button>
        </form>

        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium mb-2 block">Status</Label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant={filters.status?.includes(option.value) ? 'default' : 'outline'}
                  className={`cursor-pointer ${
                    filters.status?.includes(option.value)
                      ? 'bg-palmeiras-green hover:bg-palmeiras-green-light'
                      : ''
                  }`}
                  onClick={() => handleStatusToggle(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Método de Pagamento</Label>
            <div className="flex flex-wrap gap-2">
              {methodOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant={filters.method?.includes(option.value) ? 'default' : 'outline'}
                  className={`cursor-pointer ${
                    filters.method?.includes(option.value)
                      ? 'bg-palmeiras-green hover:bg-palmeiras-green-light'
                      : ''
                  }`}
                  onClick={() => handleMethodToggle(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="dateFrom" className="text-sm">Data Inicial</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dateTo" className="text-sm">Data Final</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleDateRangeApply}
                className="w-full"
              >
                Aplicar Período
              </Button>
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar Filtros
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
