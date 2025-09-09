import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const moveEmailSchema = z.object({
  folderId: z.string().min(1, 'ID da pasta é obrigatório')
});

// PUT - Mover email para outra pasta
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const emailId = params.id;
    const body = await request.json();
    
    // Validar dados
    const validationResult = moveEmailSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { folderId } = validationResult.data;

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
        emailConfig: {
          include: {
            folders: true
          }
        }
      }
    });

    if (!colaborador || !colaborador.emailConfig) {
      return NextResponse.json(
        { error: 'Configuração de email não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se a pasta de destino existe e pertence ao usuário
    const targetFolder = colaborador.emailConfig.folders.find(f => f.id === folderId);
    if (!targetFolder) {
      return NextResponse.json(
        { error: 'Pasta de destino não encontrada' },
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

    // Mover o email para a nova pasta
    const updatedEmail = await db.email.update({
      where: { id: emailId },
      data: { 
        folderId: folderId,
        updatedAt: new Date()
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            path: true
          }
        }
      }
    });

    return NextResponse.json({
      id: updatedEmail.id,
      folderId: updatedEmail.folderId,
      folder: updatedEmail.folder,
      message: `Email movido para ${targetFolder.name} com sucesso`
    });

  } catch (error) {
    console.error('Erro ao mover email:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}