'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { OrcamentoForm } from '@/components/orcamentos/OrcamentoForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NovoOrcamentoPage() {
  const router = useRouter();
  const { canAccess } = useAuth();

  if (!canAccess.orcamentos?.create) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Acesso Negado</h2>
          <p className="text-muted-foreground">Você não tem permissão para criar orçamentos.</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute
      requiredPermission={{
        recurso: 'orcamentos',
        acao: 'criar'
      }}
    >
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/orcamentos')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Novo Orçamento
            </h1>
            <p className="text-muted-foreground">
              Crie um novo orçamento para seus clientes
            </p>
          </div>
        </div>

        {/* Formulário */}
        <OrcamentoForm
          onSuccess={() => router.push('/orcamentos')}
          onCancel={() => router.push('/orcamentos')}
        />
      </div>
    </ProtectedRoute>
  );
}