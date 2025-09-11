import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const associateClientSchema = z.object({
  clienteId: z.string().uuid('ID do cliente deve ser um UUID válido')
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id;
    
    // Validar se o ticket existe
    const ticket = await db.helpdeskTicket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }

    // Validar dados da requisição
    const body = await request.json();
    const validatedData = associateClientSchema.parse(body);
    
    // Verificar se o cliente existe
    const cliente = await db.cliente.findUnique({
      where: { id: validatedData.clienteId }
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Associar o cliente ao ticket
    const updatedTicket = await db.helpdeskTicket.update({
      where: { id: ticketId },
      data: { 
        clienteId: validatedData.clienteId,
        updatedAt: new Date()
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true
          }
        },
        departamento: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    });

    // Log da associação
    console.log(`Ticket ${ticketId} associado ao cliente ${validatedData.clienteId}`);

    return NextResponse.json({
      success: true,
      message: 'Ticket associado ao cliente com sucesso',
      ticket: updatedTicket
    });

  } catch (error) {
    console.error('Erro ao associar ticket ao cliente:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Remover associação de cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id;
    
    // Validar se o ticket existe
    const ticket = await db.helpdeskTicket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }

    // Remover associação do cliente
    const updatedTicket = await db.helpdeskTicket.update({
      where: { id: ticketId },
      data: { 
        clienteId: null,
        updatedAt: new Date()
      }
    });

    console.log(`Associação de cliente removida do ticket ${ticketId}`);

    return NextResponse.json({
      success: true,
      message: 'Associação de cliente removida com sucesso',
      ticket: updatedTicket
    });

  } catch (error) {
    console.error('Erro ao remover associação de cliente:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}