'use client';

import { ConfiguracoesSidebar } from '@/components/configuracoes/ConfiguracoesSidebar';

interface ConfiguracoesLayoutProps {
  children: React.ReactNode;
}

export default function ConfiguracoesLayout({ children }: ConfiguracoesLayoutProps) {
  return (
    <div className="flex h-full bg-gray-50">
      <ConfiguracoesSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}