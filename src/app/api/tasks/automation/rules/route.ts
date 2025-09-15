import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Regras de automação mockadas por enquanto
    const rules = [
      {
        id: '1',
        name: 'Criar tarefa ao mover para Proposta',
        description: 'Cria automaticamente uma tarefa quando uma oportunidade é movida para a etapa de Proposta',
        triggerStage: 'Proposta',
        action: 'CREATE_TASK',
        enabled: true,
        priority: 'ALTA',
        template: {
          title: 'Preparar proposta para {oportunidade.titulo}',
          description: 'Preparar e enviar proposta comercial para o cliente {oportunidade.cliente.nome}',
          dueInDays: 3
        }
      },
      {
        id: '2',
        name: 'Notificar ao fechar negócio',
        description: 'Envia notificação quando uma oportunidade é fechada como ganha',
        triggerStage: 'Fechado - Ganho',
        action: 'NOTIFY',
        enabled: true,
        priority: 'MEDIA',
        template: {
          title: 'Negócio fechado: {oportunidade.titulo}',
          description: 'Parabéns! O negócio {oportunidade.titulo} foi fechado com sucesso.'
        }
      },
      {
        id: '3',
        name: 'Acompanhar follow-up',
        description: 'Cria tarefa de follow-up quando oportunidade fica muito tempo em uma etapa',
        triggerStage: 'Qualquer',
        action: 'CREATE_FOLLOWUP',
        enabled: false,
        priority: 'BAIXA',
        template: {
          title: 'Follow-up: {oportunidade.titulo}',
          description: 'Fazer follow-up da oportunidade que está há {dias} dias na etapa {etapa.nome}',
          dueInDays: 1
        }
      }
    ];

    return NextResponse.json(rules);
  } catch (error) {
    console.error('Erro ao buscar regras de automação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}