import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Schema para validação
const observerSchema = z.object({
  email: z.string().email('Email inválido'),
  tipo: z.enum(['colaborador', 'email']).optional().default('email')
});

// Modelo temporário para observadores (será implementado no schema)
interface TicketObserver {
  id: string;
  ticketId: string;
  email: string;
  colaboradorId?: string;
  adicionadoPorId: string;
  createdAt: Date;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verificar se o ticket existe
    const ticket = await db.helpdeskTicket.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }

    // Por enquanto, retornar array vazio até implementar o modelo no schema
    // TODO: Implementar modelo HelpdeskTicketObservador no schema.prisma
    const observers: any[] = [];
    
    // Quando o modelo estiver implementado, usar:
    // const observadores = await db.helpdeskTicketObservador.findMany({
    //   where: { ticketId: id },
    //   include: {
    //     colaborador: {
    //       select: {
    //         id: true,
    //         nome: true,
    //         email: true
    //       }
    //     }
    //   },
    //   orderBy: { createdAt: 'asc' }
    // });
    
    // const observers = observadores.map(obs => ({
    //   id: obs.id,
    //   email: obs.email,
    //   name: obs.colaborador?.nome || obs.email.split('@')[0],
    //   type: obs.colaborador ? 'colaborador' : 'manual'
    // }));

    return NextResponse.json({ observers });
  } catch (error) {
    console.error('Erro ao buscar observadores:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    
    // Validar dados
    const validatedData = observerSchema.parse(body);

    // Verificar se o ticket existe
    const ticket = await db.helpdeskTicket.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }

    // TODO: Implementar quando o modelo HelpdeskTicketObservador estiver no schema
    // Por enquanto, simular a criação do observador
    const mockObserver = {
      id: `obs_${Date.now()}`,
      email: validatedData.email,
      name: validatedData.email.split('@')[0],
      type: 'manual' as const
    };
    
    // Verificar se é um colaborador
    const colaborador = await db.colaborador.findFirst({
      where: { email: validatedData.email },
      select: { id: true, nome: true }
    });
    
    if (colaborador) {
      mockObserver.name = colaborador.nome;
      mockObserver.type = 'colaborador';
    }

    // Registrar no log usando o modelo existente
    await db.helpdeskTicketLog.create({
      data: {
        ticketId: id,
        tipo: 'MENSAGEM_ADICIONADA', // Usar um tipo existente temporariamente
        descricao: `Observador ${validatedData.email} adicionado ao ticket`,
        valorNovo: validatedData.email,
        autorNome: session.user.name || 'Sistema',
        autorEmail: session.user.email || 'sistema@exemplo.com',
        autorId: session.user.id
      }
    });

    const formattedObserver = mockObserver;

    return NextResponse.json(formattedObserver, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao adicionar observador:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const observerId = searchParams.get('observerId');

    if (!observerId) {
      return NextResponse.json(
        { error: 'ID do observador é obrigatório' },
        { status: 400 }
      );
    }

    // TODO: Implementar quando o modelo HelpdeskTicketObservador estiver no schema
    // Por enquanto, simular a remoção
    
    // Registrar no log usando o modelo existente
    await db.helpdeskTicketLog.create({
      data: {
        ticketId: id,
        tipo: 'MENSAGEM_ADICIONADA', // Usar um tipo existente temporariamente
        descricao: `Observador removido do ticket`,
        valorAnterior: `Observador ID: ${observerId}`,
        autorNome: session.user.name || 'Sistema',
        autorEmail: session.user.email || 'sistema@exemplo.com',
        autorId: session.user.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover observador:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}