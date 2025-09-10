import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ImapService } from '@/lib/email/imap-service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const emailId = params.id;

    // Buscar o email no banco
    const email = await db.email.findUnique({
      where: { id: emailId },
      include: {
        emailConfig: true,
        folder: true
      }
    });

    if (!email) {
      return NextResponse.json(
        { error: 'Email não encontrado' },
        { status: 404 }
      );
    }

    // Se já está marcado como lido, retornar sucesso
    if (email.isRead) {
      return NextResponse.json({ success: true, message: 'Email já está marcado como lido' });
    }

    try {
      // Tentar marcar como lido no servidor IMAP
      const imapService = new ImapService(email.emailConfig.id);
      await imapService.connect();
      const success = await imapService.markAsRead(email.messageId);
      await imapService.disconnect();

      if (!success) {
        console.warn('Não foi possível marcar como lido no servidor IMAP, atualizando apenas localmente');
      }
    } catch (imapError) {
      console.error('Erro ao marcar como lido no IMAP:', imapError);
      // Continuar e marcar como lido apenas localmente
    }

    // Atualizar no banco de dados
    await db.email.update({
      where: { id: emailId },
      data: {
        isRead: true,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, message: 'Email marcado como lido' });

  } catch (error) {
    console.error('Erro ao marcar email como lido:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}