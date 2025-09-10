import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ImapService } from '@/lib/email/imap-service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const emailId = params.id;
    const body = await request.json();
    const { flagged } = body;

    if (typeof flagged !== 'boolean') {
      return NextResponse.json(
        { error: 'Campo "flagged" deve ser um boolean' },
        { status: 400 }
      );
    }

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

    // Se já está no estado desejado, retornar sucesso
    if (email.isFlagged === flagged) {
      return NextResponse.json({ 
        success: true, 
        message: `Email já está ${flagged ? 'marcado' : 'desmarcado'} como favorito` 
      });
    }

    try {
      // Tentar atualizar flag no servidor IMAP
      const imapService = new ImapService(email.emailConfig.id);
      await imapService.connect();
      const success = await imapService.toggleFlag(email.messageId, flagged);
      await imapService.disconnect();

      if (!success) {
        console.warn('Não foi possível atualizar flag no servidor IMAP, atualizando apenas localmente');
      }
    } catch (imapError) {
      console.error('Erro ao atualizar flag no IMAP:', imapError);
      // Continuar e atualizar apenas localmente
    }

    // Atualizar no banco de dados
    await db.email.update({
      where: { id: emailId },
      data: {
        isFlagged: flagged,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Email ${flagged ? 'marcado' : 'desmarcado'} como favorito` 
    });

  } catch (error) {
    console.error('Erro ao atualizar flag do email:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}