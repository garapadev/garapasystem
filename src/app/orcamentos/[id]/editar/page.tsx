'use client';

import { useParams, useRouter } from 'next/navigation';
import { useOrcamento } from '@/hooks/useOrcamentos';
import { useAuth } from '@/hooks/useAuth';
import { OrcamentoForm } from '@/components/orcamentos/OrcamentoForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function EditarOrcamentoPage() {
  const params = useParams();
  const router = useRouter();
  const { canAccess } = useAuth();

  const id = params.id as string;
  const { orcamento, loading, error } = useOrcamento(id);

  if (!canAccess.orcamentos?.update) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Acesso Negado</h2>
          <p className="text-muted-foreground">Você não tem permissão para editar orçamentos.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Carregando orçamento...</p>
        </div>
      </div>
    );
  }

  if (error || !orcamento) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive">{error || 'Orçamento não encontrado'}</p>
          <Button variant="outline" onClick={() => router.push('/orcamentos')} className="mt-2">
            Voltar para orçamentos
          </Button>
        </div>
      </div>
    );
  }

  if (orcamento.status !== 'RASCUNHO') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Não é possível editar</h2>
          <p className="text-muted-foreground">
            Apenas orçamentos em rascunho podem ser editados.
          </p>
          <Button variant="outline" onClick={() => router.push(`/orcamentos/${id}`)} className="mt-2">
            Visualizar orçamento
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute
      requiredPermission={{
        recurso: 'orcamentos',
        acao: 'editar'
      }}
    >
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/orcamentos/${id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Editar Orçamento {orcamento.numero}
            </h1>
            <p className="text-muted-foreground">
              {orcamento.titulo}
            </p>
          </div>
        </div>

        {/* Formulário */}
        <OrcamentoForm
          orcamento={orcamento}
          onSuccess={() => router.push(`/orcamentos/${id}`)}
          onCancel={() => router.push(`/orcamentos/${id}`)}
        />
      </div>
    </ProtectedRoute>
  );
}