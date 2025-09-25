'use client';

import HelpdeskTab from '@/components/configuracoes/HelpdeskTab';

export default function ConfiguracoesHelpdeskPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Helpdesk</h1>
        <p className="text-muted-foreground">
          Configure os departamentos e configurações do Helpdesk
        </p>
      </div>
      
      <HelpdeskTab />
    </div>
  );
}