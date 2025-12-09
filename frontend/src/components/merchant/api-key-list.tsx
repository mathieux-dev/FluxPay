'use client';

import { useState } from 'react';
import { MoreVertical, RotateCw, Trash2, Copy, Check } from 'lucide-react';
import { APIKey } from '@/types/api-key';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { RotateAPIKeyDialog } from './rotate-api-key-dialog';
import { RevokeAPIKeyDialog } from './revoke-api-key-dialog';
import { useToast } from '@/hooks/use-toast';

interface APIKeyListProps {
  apiKeys: APIKey[];
}

export function APIKeyList({ apiKeys }: APIKeyListProps) {
  const [rotateDialogOpen, setRotateDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopyKeyId = async (keyId: string) => {
    await navigator.clipboard.writeText(keyId);
    setCopiedKeyId(keyId);
    toast({
      title: 'Copiado!',
      description: 'Key ID copiado para a área de transferência',
    });
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleRotate = (key: APIKey) => {
    setSelectedKey(key);
    setRotateDialogOpen(true);
  };

  const handleRevoke = (key: APIKey) => {
    setSelectedKey(key);
    setRevokeDialogOpen(true);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (apiKeys.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Nenhuma API key encontrada. Crie sua primeira chave para começar.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {apiKeys.map((key) => (
          <div
            key={key.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {key.keyId}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyKeyId(key.keyId)}
                >
                  {copiedKeyId === key.keyId ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Badge variant={key.active ? 'default' : 'secondary'}>
                  {key.active ? 'Ativa' : 'Inativa'}
                </Badge>
                {key.expiresAt && (
                  <Badge variant="outline">
                    Expira em {formatDate(key.expiresAt)}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Criada em: {formatDate(key.createdAt)}</span>
                {key.lastUsedAt && (
                  <span>Último uso: {formatDate(key.lastUsedAt)}</span>
                )}
                {key.usageCount !== undefined && (
                  <span>Requisições: {key.usageCount.toLocaleString('pt-BR')}</span>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleRotate(key)}>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Rotacionar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleRevoke(key)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Revogar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {selectedKey && (
        <>
          <RotateAPIKeyDialog
            open={rotateDialogOpen}
            onOpenChange={setRotateDialogOpen}
            apiKey={selectedKey}
          />
          <RevokeAPIKeyDialog
            open={revokeDialogOpen}
            onOpenChange={setRevokeDialogOpen}
            apiKey={selectedKey}
          />
        </>
      )}
    </>
  );
}
