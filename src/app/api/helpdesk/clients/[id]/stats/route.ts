import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;

    // Verificar se o cliente existe
    const cliente = await db.cliente.findUnique({
      where: { id: clientId }
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Buscar estatísticas dos tickets do cliente
    const [totalTickets, ticketsByStatus, avgResolutionTime] = await Promise.all([
      // Total de tickets
      db.helpdeskTicket.count({
        where: { clienteId: clientId }
      }),
      
      // Tickets por status
      db.helpdeskTicket.groupBy({
        by: ['status'],
        where: { clienteId: clientId },
        _count: {
          id: true
        }
      }),
      
      // Tempo médio de resolução (apenas tickets fechados)
      db.helpdeskTicket.findMany({
        where: {
          clienteId: clientId,
          status: { in: ['RESOLVIDO', 'FECHADO'] },
          dataFechamento: { not: null }
        },
        select: {
          dataAbertura: true,
          dataFechamento: true
        }
      })
    ]);

    // Processar estatísticas por status
    const statusCounts = {
      total: totalTickets,
      abertos: 0,
      fechados: 0,
      emAndamento: 0
    };

    ticketsByStatus.forEach(group => {
      switch (group.status) {
        case 'ABERTO':
        case 'AGUARDANDO_CLIENTE':
          statusCounts.abertos += group._count.id;
          break;
        case 'EM_ANDAMENTO':
          statusCounts.emAndamento += group._count.id;
          break;
        case 'RESOLVIDO':
        case 'FECHADO':
          statusCounts.fechados += group._count.id;
          break;
      }
    });

    // Calcular taxa de resolução
    const taxaResolucao = totalTickets > 0 
      ? (statusCounts.fechados / totalTickets) * 100 
      : 0;

    // Calcular tempo médio de resolução em horas
    let tempoMedioResolucao: number | undefined;
    if (avgResolutionTime.length > 0) {
      const totalResolutionTime = avgResolutionTime.reduce((acc, ticket) => {
        if (ticket.dataFechamento) {
          const diffMs = new Date(ticket.dataFechamento).getTime() - new Date(ticket.dataAbertura).getTime();
          return acc + diffMs;
        }
        return acc;
      }, 0);
      
      tempoMedioResolucao = totalResolutionTime / (avgResolutionTime.length * 1000 * 60 * 60); // em horas
    }

    // Determinar prioridade média
    const priorityTickets = await db.helpdeskTicket.groupBy({
      by: ['prioridade'],
      where: { clienteId: clientId },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    const prioridadeMedia = priorityTickets.length > 0 ? priorityTickets[0].prioridade : undefined;

    const stats = {
      ...statusCounts,
      taxaResolucao,
      tempoMedioResolucao,
      prioridadeMedia
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas do cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}