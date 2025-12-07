'use client';

import { WebhookConfigForm } from '@/components/merchant/webhook-config-form';
import { WebhookTester } from '@/components/merchant/webhook-tester';
import { WebhookDeliveries } from '@/components/merchant/webhook-deliveries';
import { WebhookCodeExamples } from '@/components/merchant/webhook-code-examples';
import { useWebhookConfig } from '@/lib/hooks/use-webhooks';

export default function WebhooksPage() {
  const { data: config } = useWebhookConfig();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Webhooks</h1>
        <p className="text-muted-foreground mt-2">
          Configure e teste webhooks para receber notificações de pagamento
        </p>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <WebhookConfigForm />
          <WebhookTester />
        </div>
        
        <div className="space-y-6">
          <WebhookCodeExamples secret={config?.secret} />
        </div>
      </div>
      
      <WebhookDeliveries />
    </div>
  );
}
