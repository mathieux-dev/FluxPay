'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAPIKeys } from '@/lib/hooks/use-api-keys';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { APICodeExamples } from '@/components/merchant/api-code-examples';
import { APITryIt } from '@/components/merchant/api-try-it';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  auth: boolean;
  requestBody?: Record<string, any>;
  responseExample: Record<string, any>;
}

const endpoints: Endpoint[] = [
  {
    method: 'POST',
    path: '/payments',
    description: 'Create a new payment',
    auth: true,
    requestBody: {
      amount: 10000,
      method: 'card',
      customer: {
        name: 'João Silva',
        email: 'joao@example.com',
        document: '12345678900'
      },
      card: {
        token: 'tok_test_123'
      }
    },
    responseExample: {
      id: 'pay_123',
      status: 'authorized',
      amount: 10000,
      method: 'card'
    }
  },
  {
    method: 'GET',
    path: '/payments/:id',
    description: 'Get payment details',
    auth: true,
    responseExample: {
      id: 'pay_123',
      status: 'paid',
      amount: 10000,
      method: 'card',
      customer: {
        name: 'João Silva',
        email: 'joao@example.com'
      },
      createdAt: '2024-12-08T10:00:00Z'
    }
  },
  {
    method: 'GET',
    path: '/payments',
    description: 'List all payments',
    auth: true,
    responseExample: {
      data: [
        {
          id: 'pay_123',
          status: 'paid',
          amount: 10000,
          method: 'card'
        }
      ],
      pagination: {
        page: 1,
        perPage: 50,
        total: 100
      }
    }
  },
  {
    method: 'POST',
    path: '/payments/:id/refund',
    description: 'Refund a payment',
    auth: true,
    requestBody: {
      amount: 10000
    },
    responseExample: {
      id: 'ref_123',
      paymentId: 'pay_123',
      amount: 10000,
      status: 'refunded'
    }
  },
  {
    method: 'POST',
    path: '/subscriptions',
    description: 'Create a subscription',
    auth: true,
    requestBody: {
      customerId: 'cus_123',
      amount: 9900,
      interval: 'monthly',
      cardToken: 'tok_test_123'
    },
    responseExample: {
      id: 'sub_123',
      status: 'active',
      amount: 9900,
      interval: 'monthly',
      nextBillingDate: '2025-01-08'
    }
  },
  {
    method: 'DELETE',
    path: '/subscriptions/:id',
    description: 'Cancel a subscription',
    auth: true,
    responseExample: {
      id: 'sub_123',
      status: 'cancelled',
      cancelledAt: '2024-12-08T10:00:00Z'
    }
  },
  {
    method: 'POST',
    path: '/payment-links',
    description: 'Create a payment link',
    auth: true,
    requestBody: {
      amount: 5000,
      description: 'Product purchase',
      expiresAt: '2024-12-31T23:59:59Z'
    },
    responseExample: {
      id: 'link_123',
      url: 'https://pay.fluxpay.com/link_123',
      qrCode: 'data:image/png;base64,...',
      expiresAt: '2024-12-31T23:59:59Z'
    }
  },
  {
    method: 'POST',
    path: '/webhooks/test',
    description: 'Send a test webhook',
    auth: true,
    responseExample: {
      success: true,
      statusCode: 200,
      response: { received: true }
    }
  }
];

export default function APIDocsPage() {
  const { data: apiKeys } = useAPIKeys();
  const { toast } = useToast();
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const activeKey = apiKeys?.find(k => k.active);

  const copyToClipboard = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    toast({
      title: 'Copiado!',
      description: 'Código copiado para a área de transferência',
    });
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Documentação da API</h1>
        <p className="text-muted-foreground mt-2">
          Documentação completa e interativa dos endpoints da FluxPay API
        </p>
      </div>

      {activeKey && (
        <Card className="bg-palmeiras-green/5 border-palmeiras-green">
          <CardHeader>
            <CardTitle className="text-palmeiras-green">Sua API Key</CardTitle>
            <CardDescription>
              Use esta chave para autenticar suas requisições
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">
                {activeKey.keyId}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(activeKey.keyId, 'api-key')}
              >
                {copiedEndpoint === 'api-key' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {endpoints.map((endpoint, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    endpoint.method === 'GET'
                      ? 'default'
                      : endpoint.method === 'POST'
                      ? 'secondary'
                      : endpoint.method === 'DELETE'
                      ? 'destructive'
                      : 'outline'
                  }
                  className="font-mono"
                >
                  {endpoint.method}
                </Badge>
                <code className="text-sm">{endpoint.path}</code>
                {endpoint.auth && (
                  <Badge variant="outline" className="ml-auto">
                    🔒 Requer autenticação
                  </Badge>
                )}
              </div>
              <CardDescription>{endpoint.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="request">
                <TabsList>
                  {endpoint.requestBody && <TabsTrigger value="request">Request</TabsTrigger>}
                  <TabsTrigger value="response">Response</TabsTrigger>
                  <TabsTrigger value="examples">Exemplos</TabsTrigger>
                  {activeKey && <TabsTrigger value="try-it">Testar</TabsTrigger>}
                </TabsList>

                {endpoint.requestBody && (
                  <TabsContent value="request" className="space-y-4">
                    <div>
                      <Label>Request Body</Label>
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                          {JSON.stringify(endpoint.requestBody, null, 2)}
                        </pre>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2"
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(endpoint.requestBody, null, 2),
                              `${endpoint.method}-${endpoint.path}-request`
                            )
                          }
                        >
                          {copiedEndpoint === `${endpoint.method}-${endpoint.path}-request` ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                )}

                <TabsContent value="response" className="space-y-4">
                  <div>
                    <Label>Response Body</Label>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                        {JSON.stringify(endpoint.responseExample, null, 2)}
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(endpoint.responseExample, null, 2),
                            `${endpoint.method}-${endpoint.path}-response`
                          )
                        }
                      >
                        {copiedEndpoint === `${endpoint.method}-${endpoint.path}-response` ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="examples">
                  {activeKey ? (
                    <APICodeExamples
                      endpoint={endpoint}
                      apiKey={activeKey.keyId}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Crie uma API key para ver os exemplos de código
                    </p>
                  )}
                </TabsContent>

                {activeKey && (
                  <TabsContent value="try-it">
                    <APITryIt
                      endpoint={endpoint}
                      apiKey={activeKey.keyId}
                    />
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
