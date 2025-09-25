'use client';

import WhatsAppApiTab from '@/components/configuracoes/WhatsAppApiTab';

export default function ConfiguracoesWhatsAppApiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">API WhatsApp</h1>
        <p className="text-muted-foreground">
          Configure as configurações da API WhatsApp
        </p>
      </div>
      
      <WhatsAppApiTab />
    </div>
  );
}