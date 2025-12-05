'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function TestCredentials() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Credenciais de Teste</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pagarme">
          <TabsList>
            <TabsTrigger value="pagarme">Pagar.me</TabsTrigger>
            <TabsTrigger value="gerencianet">Gerencianet</TabsTrigger>
          </TabsList>
          <TabsContent value="pagarme">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Cartões de Teste</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Aprovado: 4111 1111 1111 1111</li>
                  <li>Recusado: 4000 0000 0000 0002</li>
                  <li>CVV: qualquer 3 dígitos</li>
                  <li>Validade: qualquer data futura</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="gerencianet">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">PIX de Teste</h4>
                <p className="text-sm">CPF: 123.456.789-09</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Boleto de Teste</h4>
                <p className="text-sm">CNPJ: 12.345.678/0001-90</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
