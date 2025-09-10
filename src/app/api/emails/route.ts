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

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || 'INBOX';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    // Buscar colaborador pelo email da sessão
    const colaborador = await prisma.colaborador.findFirst({
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

    if (!colaborador?.emailConfig) {
      return NextResponse.json({ error: 'Configuração de email não encontrada' }, { status: 404 });
    }

    // Encontrar a pasta específica
    const emailFolder = colaborador.emailConfig.folders.find(
      f => f.path === folder
    );

    if (!emailFolder) {
      return NextResponse.json({ error: 'Pasta não encontrada' }, { status: 404 });
    }

    // Construir filtros de busca
    const whereClause: any = {
      folderId: emailFolder.id,
      isDeleted: false
    };

    if (search) {
      whereClause.OR = [
        {
          subject: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          from: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          textContent: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Buscar emails
    const emails = await prisma.email.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc'
      },
      take: limit,
      skip: offset,
      select: {
        id: true,
        messageId: true,
        subject: true,
        from: true,
        to: true,
        date: true,
        isRead: true,
        isFlagged: true,
        size: true,
        textContent: true,
        htmlContent: true,
        attachments: {
          select: {
            id: true
          }
        }
      }
    });

    // Processar dados dos emails
    const processedEmails = emails.map(email => {
      let fromArray: Array<{ address: string; name?: string }> = [];
      let toArray: Array<{ address: string; name?: string }> = [];
      
      try {
        fromArray = typeof email.from === 'string' ? JSON.parse(email.from) : email.from || [];
      } catch {
        fromArray = [{ address: email.from || '', name: '' }];
      }
      
      try {
        toArray = typeof email.to === 'string' ? JSON.parse(email.to) : email.to || [];
      } catch {
        toArray = [{ address: email.to || '', name: '' }];
      }

      // Gerar preview do conteúdo
      const preview = email.textContent 
        ? email.textContent.substring(0, 200).replace(/\n/g, ' ').trim()
        : email.htmlContent 
          ? email.htmlContent.replace(/<[^>]*>/g, '').substring(0, 200).replace(/\n/g, ' ').trim()
          : 'Sem conteúdo';

      return {
        id: email.id,
        messageId: email.messageId,
        subject: email.subject,
        from: fromArray,
        to: toArray,
        date: email.date.toISOString(),
        isRead: email.isRead,
        isFlagged: email.isFlagged,
        hasAttachments: email.attachments && email.attachments.length > 0,
        preview: preview,
        size: email.size || 0
      };
    });

    // Contar total de emails para paginação
    const totalCount = await prisma.email.count({
      where: whereClause
    });

    return NextResponse.json({
      emails: processedEmails,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });
  } catch (error) {
    console.error('Erro ao buscar emails:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}