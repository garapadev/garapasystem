import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

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
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const emailId = id;

    // Buscar colaborador pelo email da sessão
    const colaborador = await prisma.colaborador.findFirst({
      where: {
        usuarios: {
          is: {
            email: session.user.email
          }
        }
      },
      include: {
        emailConfig: true
      }
    });

    if (!colaborador?.emailConfig) {
      return NextResponse.json({ error: 'Configuração de email não encontrada' }, { status: 404 });
    }

    // Verificar se o email pertence ao colaborador
    const email = await prisma.email.findFirst({
      where: {
        id: emailId,
        emailConfigId: colaborador.emailConfig.id
      }
    });

    if (!email) {
      return NextResponse.json({ error: 'Email não encontrado' }, { status: 404 });
    }

    // Marcar como lido
    const updatedEmail = await prisma.email.update({
      where: {
        id: emailId
      },
      data: {
        isRead: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      email: {
        id: updatedEmail.id,
        isRead: updatedEmail.isRead
      }
    });
  } catch (error) {
    console.error('Erro ao marcar email como lido:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}