'use client';

import SobreTab from '@/components/configuracoes/SobreTab';

export default function ConfiguracoesSobrePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sobre o Sistema</h1>
        <p className="text-muted-foreground">
          Informações sobre a versão e status do sistema
        </p>
      </div>
      
      <SobreTab />
    </div>
  );
}