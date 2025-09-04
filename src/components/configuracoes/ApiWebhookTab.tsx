'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Key, Webhook, FileText, Activity } from 'lucide-react';
import { ApiKeysSection } from './ApiKeysSection';
import { WebhooksSection } from './WebhooksSection';
import { ApiDocsSection } from './ApiDocsSection';
import { LogsSection } from './LogsSection';

export function ApiWebhookTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">API & Webhook</h2>
        <p className="text-muted-foreground">
          Gerencie chaves de API, configurações de webhook e monitore logs de integração.
        </p>
      </div>

      <Tabs defaultValue="api-keys" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Chaves API
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentação
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chaves de API</CardTitle>
              <CardDescription>
                Gerencie as chaves de API para integração com sistemas externos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApiKeysSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Webhook</CardTitle>
              <CardDescription>
                Configure webhooks para receber notificações de eventos do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WebhooksSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentação da API</CardTitle>
              <CardDescription>
                Explore a documentação completa da API com exemplos e esquemas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApiDocsSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Integração</CardTitle>
              <CardDescription>
                Monitore logs de uso da API e envios de webhook.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LogsSection />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}