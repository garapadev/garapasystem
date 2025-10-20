import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { ImapService } from '@/lib/email/imap-service';

export async function POST(request: NextRequest) {
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
      },
      include: {
        emailConfig: true
      }
    });

    if (!colaborador?.emailConfig) {
      return NextResponse.json({ error: 'Configuração de email não encontrada' }, { status: 404 });
    }

    if (!colaborador.emailConfig.ativo) {
      return NextResponse.json({ error: 'Configuração de email desativada' }, { status: 400 });
    }

    // Iniciar sincronização
    const imapService = new ImapService(colaborador.emailConfig.id);
    
    try {
      await imapService.connect();
      await imapService.syncFolders();
      await imapService.syncEmails();
      
      // Atualizar timestamp da última sincronização
      await prisma.emailConfig.update({
        where: {
          id: colaborador.emailConfig.id
        },
        data: {
          lastSync: new Date()
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Sincronização iniciada com sucesso',
        lastSync: new Date().toISOString()
      });
    } finally {
      await imapService.disconnect();
    }
  } catch (error) {
    console.error('Erro na sincronização:', error);
    return NextResponse.json(
      { 
        error: 'Erro na sincronização', 
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}