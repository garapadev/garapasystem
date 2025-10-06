import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const importantSchema = z.object({
  important: z.boolean()
});

// POST - Marcar/desmarcar email como importante
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do email é obrigatório' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const emailId = id;
    const body = await request.json();
    
    // Validar dados
    const validationResult = importantSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { important } = validationResult.data;

    // Buscar colaborador pelo email da sessão
    const colaborador = await db.colaborador.findFirst({
      where: {
        usuarios: {
          some: {
            email: session.user.email
          }
        }
      },
      include: {
        emailConfig: true
      }
    });

    if (!colaborador || !colaborador.emailConfig) {
      return NextResponse.json(
        { error: 'Configuração de email não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o email pertence ao usuário
    const email = await db.email.findFirst({
      where: {
        id: emailId,
        emailConfigId: colaborador.emailConfig.id
      }
    });

    if (!email) {
      return NextResponse.json(
        { error: 'Email não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar status de importância (usando isFlagged)
    const updatedEmail = await db.email.update({
      where: { id: emailId },
      data: { 
        isFlagged: important,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      id: updatedEmail.id,
      isFlagged: updatedEmail.isFlagged,
      message: important ? 'Email marcado como importante' : 'Email desmarcado como importante'
    });

  } catch (error) {
    console.error('Erro ao alterar importância do email:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}