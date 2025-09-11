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

    // Buscar histórico de tickets do cliente
    const tickets = await db.helpdeskTicket.findMany({
      where: {
        clienteId: clientId
      },
      include: {
        departamento: {
          select: {
            id: true,
            nome: true
          }
        },
        responsavel: {
          select: {
            id: true,
            nome: true
          }
        },
        _count: {
          select: {
            mensagens: true
          }
        }
      },
      orderBy: {
        dataAbertura: 'desc'
      }
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Erro ao buscar histórico de tickets:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}