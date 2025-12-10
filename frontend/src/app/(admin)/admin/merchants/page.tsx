'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MerchantList } from '@/components/admin/merchant-list';
import { MerchantFilters } from '@/components/admin/merchant-filters';
import { CreateMerchantDialog } from '@/components/admin/create-merchant-dialog';
import { MerchantFilters as MerchantFiltersType } from '@/types/merchant';

export default function MerchantsPage() {
  const [filters, setFilters] = useState<MerchantFiltersType>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-palmeiras-green">Merchants</h1>
          <p className="text-muted-foreground">
            Gerencie contas de merchants e suas configurações
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Merchant
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <MerchantFilters filters={filters} onChange={setFilters} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Merchants</CardTitle>
        </CardHeader>
        <CardContent>
          <MerchantList filters={filters} />
        </CardContent>
      </Card>

      <CreateMerchantDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}