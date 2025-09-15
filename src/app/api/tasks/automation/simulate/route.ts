import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { oportunidadeId, novaEtapaId } = await request.json();

    if (!oportunidadeId || !novaEtapaId) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos' },
        { status: 400 }
      );
    }

    // Buscar informações da oportunidade
    const oportunidade = await prisma.oportunidade.findUnique({
      where: { id: oportunidadeId },
      include: {
        Cliente: true,
        EtapaPipeline: true
      }
    });

    if (!oportunidade) {
      return NextResponse.json(
        { error: 'Oportunidade não encontrada' },
        { status: 404 }
      );
    }

    // Buscar informações da nova etapa
    const novaEtapa = await prisma.etapaPipeline.findUnique({
      where: { id: novaEtapaId }
    });

    if (!novaEtapa) {
      return NextResponse.json(
        { error: 'Etapa não encontrada' },
        { status: 404 }
      );
    }

    // Simular criação de tarefa baseada na regra
    const simulationResult = {
      oportunidade: {
        id: oportunidade.id,
        titulo: oportunidade.titulo,
        valor: oportunidade.valor,
        cliente: oportunidade.Cliente?.nome || 'Cliente não definido'
      },
      etapaAnterior: oportunidade.EtapaPipeline?.nome || 'Etapa anterior',
      novaEtapa: novaEtapa.nome,
      tarefasCriadas: [] as any[],
      notificacoes: [] as any[]
    };

    // Simular criação de tarefa para etapa "Proposta"
    if (novaEtapa.nome.toLowerCase().includes('proposta')) {
      const novaTarefa = {
        id: `sim_${Date.now()}`,
        titulo: `Preparar proposta para ${oportunidade.titulo}`,
        descricao: `Preparar e enviar proposta comercial para o cliente ${oportunidade.Cliente?.nome || 'N/A'}`,
        prazo: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
        prioridade: 'ALTA',
        status: 'PENDENTE'
      };
      
      simulationResult.tarefasCriadas.push(novaTarefa);
    }

    // Simular notificação para etapa "Fechado - Ganho"
    if (novaEtapa.nome.toLowerCase().includes('fechado') && novaEtapa.nome.toLowerCase().includes('ganho')) {
      const notificacao = {
        id: `not_${Date.now()}`,
        titulo: `Negócio fechado: ${oportunidade.titulo}`,
        mensagem: `Parabéns! O negócio ${oportunidade.titulo} foi fechado com sucesso.`,
        tipo: 'SUCESSO'
      };
      
      simulationResult.notificacoes.push(notificacao);
    }

    console.log(`Simulação de movimento: Oportunidade ${oportunidadeId} para etapa ${novaEtapa.nome}`);

    return NextResponse.json({
      success: true,
      message: 'Simulação executada com sucesso',
      result: simulationResult
    });
  } catch (error) {
    console.error('Erro ao simular movimento de oportunidade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}