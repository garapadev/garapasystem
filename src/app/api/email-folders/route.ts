import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar colaborador pelo email da sessão
    const colaborador = await prisma.colaborador.findFirst({
      where: {
        usuarios: {
          is: {
            email: session.user.email
          }
        }
      }
    });

    if (!colaborador) {
      return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 });
    }

    // Buscar configuração de email ativa do colaborador
    const emailConfig = await prisma.emailConfig.findFirst({
      where: {
        colaboradorId: colaborador.id,
        ativo: true,
        syncEnabled: true
      }
    });

    if (!emailConfig) {
      return NextResponse.json({ error: 'Configuração de email não encontrada' }, { status: 404 });
    }

    // Buscar pastas do colaborador
    const folders = await prisma.emailFolder.findMany({
      where: {
        emailConfigId: emailConfig.id
      },
      orderBy: [
        { specialUse: 'asc' },
        { name: 'asc' }
      ]
    });

    // Contar emails não lidos por pasta
    const foldersWithCounts = await Promise.all(
      folders.map(async (folder) => {
        const unreadCount = await prisma.email.count({
          where: {
            folderId: folder.id,
            isRead: false
          }
        });

        const totalCount = await prisma.email.count({
          where: {
            folderId: folder.id
          }
        });

        return {
          id: folder.id,
          name: folder.name,
          path: folder.path,
          specialUse: folder.specialUse,
          unreadCount: unreadCount,
          totalCount: totalCount
        };
      })
    );

    return NextResponse.json({ folders: foldersWithCounts });
  } catch (error) {
    console.error('Erro ao buscar pastas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}