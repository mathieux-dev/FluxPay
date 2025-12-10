'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MerchantDetails } from '@/components/admin/merchant-details';
import { MerchantStats } from '@/components/admin/merchant-stats';
import { MerchantProviderConfig } from '@/components/admin/merchant-provider-config';
import { MerchantStatusToggle } from '@/components/admin/merchant-status-toggle';
import { useMerchant } from '@/lib/hooks/use-merchants';
import { Skeleton } from '@/components/ui/skeleton';

export default function MerchantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const merchantId = params.id as string;
  const { data: merchant, isLoading, error } = useMerchant(merchantId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-[300px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
        </div>
      </div>
    );
  }

  if (error || !merchant) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Erro ao carregar merchant: {error?.message || 'Merchant não encontrado'}
        </p>
        <Button onClick={() => router.back()} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-palmeiras-green">
                {merchant.name}
              </h1>
              <Badge variant={merchant.active ? 'default' : 'secondary'}>
                {merchant.active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <p className="text-muted-foreground">{merchant.email}</p>
          </div>
        </div>
        <MerchantStatusToggle merchant={merchant} />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="providers">Provedores</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <MerchantStats merchantId={merchantId} />
          <MerchantDetails merchant={merchant} />
        </TabsContent>

        <TabsContent value="providers">
          <MerchantProviderConfig merchant={merchant} />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Merchant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configurações adicionais serão implementadas em versões futuras.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}