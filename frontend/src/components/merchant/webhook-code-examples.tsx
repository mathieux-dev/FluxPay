'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WebhookCodeExamplesProps {
  secret?: string;
}

export function WebhookCodeExamples({ secret = 'your_webhook_secret' }: WebhookCodeExamplesProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('javascript');
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Código copiado' });
  };
  
  const examples = {
    javascript: `// Node.js com Express
const express = require('express');
const crypto = require('crypto');

app.post('/webhooks/fluxpay', express.json(), (req, res) => {
  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  const nonce = req.headers['x-nonce'];
  
  // Verificar assinatura
  const payload = JSON.stringify(req.body);
  const message = \`\${timestamp}.\${nonce}.\${payload}\`;
  const expectedSignature = crypto
    .createHmac('sha256', '${secret}')
    .update(message)
    .digest('base64');
  
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Processar webhook
  const { event, data } = req.body;
  console.log('Webhook recebido:', event, data);
  
  res.status(200).json({ received: true });
});`,
    
    python: `# Python com Flask
from flask import Flask, request, jsonify
import hmac
import hashlib
import json

app = Flask(__name__)

@app.route('/webhooks/fluxpay', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Signature')
    timestamp = request.headers.get('X-Timestamp')
    nonce = request.headers.get('X-Nonce')
    
    # Verificar assinatura
    payload = json.dumps(request.json, separators=(',', ':'))
    message = f"{timestamp}.{nonce}.{payload}"
    expected_signature = hmac.new(
        b'${secret}',
        message.encode(),
        hashlib.sha256
    ).digest().hex()
    
    if signature != expected_signature:
        return jsonify({'error': 'Invalid signature'}), 401
    
    # Processar webhook
    event = request.json.get('event')
    data = request.json.get('data')
    print(f'Webhook recebido: {event}', data)
    
    return jsonify({'received': True}), 200`,
    
    php: `<?php
// PHP
$signature = $_SERVER['HTTP_X_SIGNATURE'];
$timestamp = $_SERVER['HTTP_X_TIMESTAMP'];
$nonce = $_SERVER['HTTP_X_NONCE'];

// Verificar assinatura
$payload = file_get_contents('php://input');
$message = "$timestamp.$nonce.$payload";
$expectedSignature = base64_encode(
    hash_hmac('sha256', $message, '${secret}', true)
);

if ($signature !== $expectedSignature) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

// Processar webhook
$data = json_decode($payload, true);
$event = $data['event'];
error_log("Webhook recebido: $event");

http_response_code(200);
echo json_encode(['received' => true]);
?>`,
    
    csharp: `// C# com ASP.NET Core
using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;

[ApiController]
[Route("webhooks/fluxpay")]
public class WebhookController : ControllerBase
{
    [HttpPost]
    public IActionResult ReceiveWebhook([FromBody] WebhookPayload payload)
    {
        var signature = Request.Headers["X-Signature"].ToString();
        var timestamp = Request.Headers["X-Timestamp"].ToString();
        var nonce = Request.Headers["X-Nonce"].ToString();
        
        // Verificar assinatura
        var payloadJson = JsonSerializer.Serialize(payload);
        var message = $"{timestamp}.{nonce}.{payloadJson}";
        var expectedSignature = ComputeHmac(message, "${secret}");
        
        if (signature != expectedSignature)
        {
            return Unauthorized(new { error = "Invalid signature" });
        }
        
        // Processar webhook
        Console.WriteLine($"Webhook recebido: {payload.Event}");
        
        return Ok(new { received = true });
    }
    
    private string ComputeHmac(string message, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(message));
        return Convert.ToBase64String(hash);
    }
}`
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exemplos de Código</CardTitle>
        <CardDescription>
          Exemplos de verificação de assinatura em diferentes linguagens
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
            <TabsTrigger value="php">PHP</TabsTrigger>
            <TabsTrigger value="csharp">C#</TabsTrigger>
          </TabsList>
          
          {Object.entries(examples).map(([lang, code]) => (
            <TabsContent key={lang} value={lang} className="space-y-2">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 z-10"
                  onClick={() => copyToClipboard(code)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-96">
                  <code>{code}</code>
                </pre>
              </div>
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="mt-4 p-4 bg-muted rounded-md">
          <h4 className="font-semibold text-sm mb-2">Payload de Exemplo</h4>
          <pre className="text-xs overflow-auto">
{`{
  "event": "payment.paid",
  "data": {
    "id": "pay_123456789",
    "amount": 10000,
    "status": "paid",
    "method": "card",
    "customer": {
      "name": "João Silva",
      "email": "joao@example.com"
    },
    "createdAt": "2024-12-07T10:00:00Z",
    "paidAt": "2024-12-07T10:01:00Z"
  }
}`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
