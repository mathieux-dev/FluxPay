'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MerchantFilters as MerchantFiltersType } from '@/types/merchant';

interface MerchantFiltersProps {
  filters: MerchantFiltersType;
  onChange: (filters: MerchantFiltersType) => void;
}

export function MerchantFilters({ filters, onChange }: MerchantFiltersProps) {
  const handleSearchChange = (search: string) => {
    onChange({ ...filters, search: search || undefined });
  };

  const handleStatusChange = (status: string) => {
    onChange({ 
      ...filters, 
      status: status === 'all' ? undefined : (status as 'active' | 'inactive')
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="search">Buscar</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            id="search"
            placeholder="Nome ou email do merchant..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={filters.status || 'all'}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}