import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createFolderSchema = z.object({
  name: z.string().min(1, 'Nome da pasta é obrigatório'),
  path: z.string().min(1, 'Caminho da pasta é obrigatório'),
  delimiter: z.string().optional().default('/'),
  specialUse: z.string().optional()
});

// POST - Criar nova pasta de email
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validar dados
    const validationResult = createFolderSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { name, path, delimiter, specialUse } = validationResult.data;

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

    // Verificar se já existe uma pasta com o mesmo caminho
    const existingFolder = colaborador.emailConfig.folders.find(f => f.path === path);
    if (existingFolder) {
      return NextResponse.json(
        { error: 'Já existe uma pasta com este caminho' },
        { status: 409 }
      );
    }

    // Criar a nova pasta
    const newFolder = await db.emailFolder.create({
      data: {
        name,
        path,
        delimiter,
        specialUse,
        emailConfigId: colaborador.emailConfig.id,
        totalMessages: 0,
        unreadMessages: 0
      }
    });

    return NextResponse.json({
      id: newFolder.id,
      name: newFolder.name,
      path: newFolder.path,
      delimiter: newFolder.delimiter,
      specialUse: newFolder.specialUse,
      totalMessages: newFolder.totalMessages,
      unreadMessages: newFolder.unreadMessages,
      message: 'Pasta criada com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar pasta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}