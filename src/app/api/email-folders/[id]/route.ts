import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// DELETE - Deletar pasta de email
export async function DELETE(
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

    const folderId = params.id;

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

    // Verificar se a pasta existe e pertence ao usuário
    const folder = colaborador.emailConfig.folders.find(f => f.id === folderId);
    if (!folder) {
      return NextResponse.json(
        { error: 'Pasta não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se a pasta não é uma pasta especial do sistema
    const systemFolders = ['INBOX', 'Sent', 'Drafts', 'Trash', 'Spam'];
    if (systemFolders.includes(folder.name) || folder.specialUse) {
      return NextResponse.json(
        { error: 'Não é possível deletar pastas do sistema' },
        { status: 400 }
      );
    }

    // Verificar se a pasta tem emails
    const emailCount = await db.email.count({
      where: {
        folderId: folderId,
        emailConfigId: colaborador.emailConfig.id
      }
    });

    if (emailCount > 0) {
      return NextResponse.json(
        { error: `Não é possível deletar pasta com ${emailCount} email(s). Mova ou delete os emails primeiro.` },
        { status: 400 }
      );
    }

    // Deletar a pasta
    await db.emailFolder.delete({
      where: { id: folderId }
    });

    return NextResponse.json({
      message: `Pasta '${folder.name}' deletada com sucesso`
    });

  } catch (error) {
    console.error('Erro ao deletar pasta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET - Buscar detalhes de uma pasta específica
export async function GET(
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

    const folderId = params.id;

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

    // Buscar a pasta com contadores atualizados
    const folder = await db.emailFolder.findFirst({
      where: {
        id: folderId,
        emailConfigId: colaborador.emailConfig.id
      }
    });

    if (!folder) {
      return NextResponse.json(
        { error: 'Pasta não encontrada' },
        { status: 404 }
      );
    }

    // Contar emails lidos e não lidos
    const [totalEmails, unreadEmails] = await Promise.all([
      db.email.count({
        where: {
          folderId: folderId,
          emailConfigId: colaborador.emailConfig.id,
          isDeleted: false
        }
      }),
      db.email.count({
        where: {
          folderId: folderId,
          emailConfigId: colaborador.emailConfig.id,
          isRead: false,
          isDeleted: false
        }
      })
    ]);

    return NextResponse.json({
      id: folder.id,
      name: folder.name,
      path: folder.path,
      delimiter: folder.delimiter,
      specialUse: folder.specialUse,
      subscribed: folder.subscribed,
      totalMessages: totalEmails,
      unreadMessages: unreadEmails,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt
    });

  } catch (error) {
    console.error('Erro ao buscar pasta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}