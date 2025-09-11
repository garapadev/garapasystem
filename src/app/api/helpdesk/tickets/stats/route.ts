import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {

    // Buscar estatísticas gerais
    const [totalTickets, ticketsPorStatus, ticketsPorPrioridade, ticketsPorDepartamento] = await Promise.all([
      // Total de tickets
      db.helpdeskTicket.count(),
      
      // Tickets por status
      db.helpdeskTicket.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      }),
      
      // Tickets por prioridade
      db.helpdeskTicket.groupBy({
        by: ['prioridade'],
        _count: {
          id: true
        }
      }),
      
      // Tickets por departamento
      db.helpdeskTicket.groupBy({
        by: ['departamentoId'],
        _count: {
          id: true
        }
      })
    ]);

    // Formatar dados de status
    const porStatus = ticketsPorStatus.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Formatar dados de prioridade
    const porPrioridade = ticketsPorPrioridade.reduce((acc, item) => {
      acc[item.prioridade] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Buscar nomes dos departamentos para formatar dados
    const departamentos = await db.helpdeskDepartamento.findMany({
      select: {
        id: true,
        nome: true
      }
    });

    const departamentosMap = departamentos.reduce((acc, dept) => {
      acc[dept.id] = dept.nome;
      return acc;
    }, {} as Record<number, string>);

    // Formatar dados de departamento
    const porDepartamento = ticketsPorDepartamento.reduce((acc, item) => {
      const nomeDepartamento = departamentosMap[item.departamentoId] || 'Sem departamento';
      acc[nomeDepartamento] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    const stats = {
      total: totalTickets,
      porStatus,
      porPrioridade,
      porDepartamento
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas de tickets:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}